"use client";

import { useEffect, useRef, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../lib/firebaseConfig";
import { FaPaperPlane, FaPlus, FaDownload, FaTimes } from "react-icons/fa";
import moment from "moment";
import Image from "next/image";
import Link from "next/link";
import styles from "./reportlist.module.css";

const OperatorReportPage = () => {
  const [companyID, setCompanyID] = useState(null);
  const [operatorID, setOperatorID] = useState(null);
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [modalSrc, setModalSrc] = useState(null);
  const [modalFileName, setModalFileName] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [otherTyping, setOtherTyping] = useState(false);
  const [visibleTimestamps, setVisibleTimestamps] = useState([]);
  const [loading, setLoading] = useState(true);

  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    setCompanyID(localStorage.getItem("companyID"));
    setOperatorID(localStorage.getItem("operatorID"));
  }, []);

  useEffect(() => {
    if (!companyID) return;

    const q = query(collection(db, "busReports"), where("companyID", "==", companyID));
    const messageUnsubs = {};

    const unsubReports = onSnapshot(q, async (snapshot) => {
      const updatedReports = [];

      for (const docSnap of snapshot.docs) {
        const reportID = docSnap.id;
        const reportData = { id: reportID, ...docSnap.data(), hasUnreadMessages: false };

        updatedReports.push(reportData);

        const messagesRef = collection(db, "busReports", reportID, "messages");

        if (!messageUnsubs[reportID]) {
          messageUnsubs[reportID] = onSnapshot(messagesRef, (msgSnap) => {
            let hasUnread = false;
            let latestTimestamp = null;

            msgSnap.forEach((msgDoc) => {
              const msg = msgDoc.data();
              if (msg.senderRole === "admin" && msg.seen === false) {
                hasUnread = true;
              }
              if (!latestTimestamp || msg.createdAt?.toDate() > latestTimestamp) {
                latestTimestamp = msg.createdAt?.toDate();
              }
            });

            setReports((prev) => {
              const updated = prev.map((r) =>
                r.id === reportID
                  ? {
                      ...r,
                      hasUnreadMessages: !r.operatorSeen || hasUnread,
                      latestMessageAt: latestTimestamp || r.createdAt?.toDate(),
                    }
                  : r
              );

              return updated.sort((a, b) => {
                const timeA = a.latestMessageAt || new Date(0);
                const timeB = b.latestMessageAt || new Date(0);
                return timeB - timeA;
              });
            });
          });
        }
      }

      const sorted = updatedReports.sort((a, b) => {
        if (a.hasUnreadMessages && !b.hasUnreadMessages) return -1;
        if (!a.hasUnreadMessages && b.hasUnreadMessages) return 1;

        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB - dateA;
      });

      setReports(sorted);
      setLoading(false);

      // ✅ Automatically close chat if the selected report is settled
      if (selectedReport) {
        const updatedSelected = sorted.find((r) => r.id === selectedReport.id);
        if (!updatedSelected || updatedSelected.status === "settled") {
          setSelectedReport(null);
        }
      }
    });

    return () => {
      unsubReports();
      Object.values(messageUnsubs).forEach((unsub) => unsub());
    };
  }, [companyID, selectedReport]);

  useEffect(() => {
    if (!selectedReport) return;

    const markSeen = async () => {
      await updateDoc(doc(db, "busReports", selectedReport.id), { operatorSeen: true });
      setReports((prev) =>
        prev.map((r) =>
          r.id === selectedReport.id ? { ...r, hasUnreadMessages: false } : r
        )
      );
    };
    markSeen();

    const messagesRef = collection(db, "busReports", selectedReport.id, "messages");
    const unsubMessages = onSnapshot(query(messagesRef, orderBy("createdAt", "asc")), (snapshot) => {
      const fetched = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
      setMessages(fetched);

      fetched.forEach((msg) => {
        if (!msg.seen && msg.senderRole === "admin") {
          updateDoc(doc(db, "busReports", selectedReport.id, "messages", msg.id), { seen: true });
        }
      });
    });

    const typingRef = doc(db, "busReports", selectedReport.id, "typing", "admin");
    const unsubTyping = onSnapshot(typingRef, (snap) => {
      setOtherTyping(snap.exists() && snap.data().isTyping);
    });

    return () => {
      unsubMessages();
      unsubTyping();
    };
  }, [selectedReport]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!selectedReport) return;
    const typingDoc = doc(db, "busReports", selectedReport.id, "typing", "operator");
    setDoc(typingDoc, { isTyping: newMessage.trim().length > 0 });
    const timeout = setTimeout(() => setDoc(typingDoc, { isTyping: false }), 2000);
    return () => clearTimeout(timeout);
  }, [newMessage, selectedReport]);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    if (selected.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
      setFileType(selected.type.startsWith("image/") ? "image" : "document");
    };
    reader.readAsDataURL(selected);
    setFile(selected);
  };

  const sendMessage = async () => {
    if ((!newMessage.trim() && !file) || !selectedReport) return;

    const messagesRef = collection(db, "busReports", selectedReport.id, "messages");
    let uploadedURL = "";
    let filename = "";

    if (file) {
      try {
        const fileRef = ref(storage, `reports/${selectedReport.id}/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(fileRef, file);
        uploadedURL = await getDownloadURL(snapshot.ref);
        filename = file.name;
      } catch (err) {
        console.error("File upload failed:", err);
        alert("File upload failed. Try again.");
        return;
      }
    }

    const newMsg = {
      text: newMessage,
      imageUrl: fileType === "image" ? uploadedURL : "",
      docUrl: fileType === "document" ? uploadedURL : "",
      filename: fileType === "document" ? filename : "",
      senderRole: "operator",
      senderID: operatorID,
      createdAt: serverTimestamp(),
      seen: false,
      status: "sending",
    };

    try {
      const docRef = await addDoc(messagesRef, newMsg);
      await updateDoc(docRef, { status: "delivered" });

      await updateDoc(doc(db, "busReports", selectedReport.id), {
        operatorSeen: true,
        adminSeen: true,
      });

      setReports((prev) =>
        prev.map((r) =>
          r.id === selectedReport.id ? { ...r, hasUnreadMessages: false } : r
        )
      );
    } catch (err) {
      console.error("Message failed to send:", err);
      alert("Failed to send message.");
    }

    setNewMessage("");
    setFile(null);
    setPreview(null);
    setFileType(null);
  };

  const toggleTimestamp = (id) => {
    setVisibleTimestamps((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const formatDate = (ts) => moment(ts?.toDate()).format("MMMM D, YYYY");
  const formatTime = (ts) => moment(ts?.toDate()).format("h:mm A");
  const shouldShowDate = (current, previous) => {
    if (!previous) return true;
    return moment(current?.toDate()).format("YYYY-MM-DD") !== moment(previous?.toDate()).format("YYYY-MM-DD");
  };

  const activeReports = reports.filter((r) => r.status !== "settled");

  return (
    <div className={styles.container}>
      <div className={styles.reportList}>
        <div className={styles.historyLinkContainer}>
          <Link href="/dashboard/report/history" className={styles.historyLink}>
            View History
          </Link>
        </div>
        {loading ? (
          <p className={styles.noData}>Loading reports...</p>
        ) : activeReports.length === 0 ? (
          <p className={styles.noData}>No active reports available.</p>
        ) : (
          activeReports.map((report) => (
            <div
              key={report.id}
              className={`
                ${styles.reportItem}
                ${report.hasUnreadMessages ? styles.unread : ""}
                ${selectedReport?.id === report.id ? styles.selectedReport : ""}
              `}
              onClick={() => setSelectedReport(report)}
            >
              <p><strong>Plate No.:</strong> {report.busPlateNumber}</p>
              <p><strong>Type:</strong> {report.reportType}</p>
              <p><strong>Status:</strong> {report.status}</p>
              {report.hasUnreadMessages && <span className={styles.unreadDot}></span>}
            </div>
          ))
        )}
      </div>

      {selectedReport ? (
        <div className={styles.chatSection}>
      <div className={styles.reportTop}>
        <div className={styles.reportInfoContainer}>
          <div className={styles.reportText}>
            <h3>Plate No: {selectedReport.busPlateNumber}</h3>
            <p><strong>Type:</strong> {selectedReport.reportType}</p>
            <p><strong>Description:</strong> {selectedReport.description}</p>
            <p><strong>Date:</strong> {formatDate(selectedReport.createdAt)}</p>
          </div>
          {selectedReport.imageUrl && (
            <div className={styles.reportImage}>
              <Image
                src={selectedReport.imageUrl}
                alt="Report"
                className={styles.fullMedia}
                width={200}
                height={120}
                onClick={() => {
                  setModalSrc(selectedReport.imageUrl);
                  setModalType("image");
                }}
              />
            </div>
          )}
        </div>
      </div>

          <div className={styles.chatBox}>
            {messages.length === 0 ? (
              <div className={styles.noData}>No messages yet. Start a conversation…</div>
            ) : (
              messages.map((msg, i) => {
                const prev = messages[i - 1];
                const isOperator = msg.senderRole === "operator";
                return (
                  <div key={msg.id}>
                    {shouldShowDate(msg.createdAt, prev?.createdAt) && (
                      <div className={styles.dateDivider}>{formatDate(msg.createdAt)}</div>
                    )}
                    {visibleTimestamps.includes(msg.id) && (
                      <div className={styles.timestampTopCenter}>{formatTime(msg.createdAt)}</div>
                    )}

                    <div
                      className={`${styles.messageRow} ${isOperator ? styles.right : styles.left}`}
                      onClick={() => toggleTimestamp(msg.id)}
                    >
                      <div className={styles.messageBubble}>
                        {msg.text && <p>{msg.text}</p>}
                        {msg.imageUrl && (
                          <Image
                            src={msg.imageUrl}
                            alt="Message Image"
                            width={300}
                            height={200}
                            onClick={() => {
                              setModalSrc(msg.imageUrl);
                              setModalType("image");
                            }}
                            className={styles.media}
                          />
                        )}
                        {msg.docUrl && (
                          <div className={styles.docContainer}>
                            <span
                              onClick={() => {
                                setModalSrc(msg.docUrl);
                                setModalFileName(msg.filename);
                                setModalType("document");
                              }}
                            >
                              {msg.filename || "Open Document"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {isOperator && i === messages.length - 1 && (
                      <div className={styles.statusBottom}>
                        {msg.status === "sending" && <span>Sending...</span>}
                        {msg.status === "delivered" && !msg.seen && <span>Delivered</span>}
                        {msg.seen && <span>Seen</span>}
                      </div>
                    )}
                  </div>
                );

              })
            )}
            {otherTyping && <div className={styles.typingIndicator}>typing...</div>}
            <div ref={chatEndRef} />
          </div>

          <div className={styles.inputArea}>
            <button className={styles.addButton} onClick={() => fileInputRef.current.click()}>
              <FaPlus />
            </button>
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              rows={1}
            />
            <input
              type="file"
              accept="image/*,application/pdf,.doc,.docx"
              onChange={handleFileChange}
              style={{ display: "none" }}
              ref={fileInputRef}
            />
            <button onClick={sendMessage} className={styles.sendButton} disabled={!newMessage.trim() && !file}>
              <FaPaperPlane />
            </button>
          </div>

          {preview && (
            <div className={styles.previewAttachment}>
              {fileType === "image" ? (
                <img
                  src={preview}
                  alt="Preview"
                  width={150}
                  height={100}
                  className={styles.preview}
                />
              ) : (
                <p>{file.name}</p>
              )}
              <button
                className={styles.removePreviewButton}
                onClick={() => {
                  setPreview(null);
                  setFile(null);
                  setFileType(null);
                }}
              >
                <FaTimes />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className={styles.watermark}>SAKE</div>
      )}

      {modalSrc && (
        <div className={styles.modalOverlay} onClick={() => setModalSrc(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            {modalType === "image" ? (
              <Image
                src={modalSrc}
                alt="Full View"
                width={800}
                height={600}
                className={styles.fullMedia}
              />
            ) : (
              <iframe src={modalSrc} className={styles.fullMedia} title="Document Preview"></iframe>
            )}
            <div className={styles.modalButtons}>
              <a
                href={modalSrc}
                download={modalFileName || true}
                target="_blank"
                rel="noreferrer"
                className={styles.modalIconButton}
              >
                <FaDownload />
              </a>
              <button onClick={() => setModalSrc(null)} className={styles.modalIconButton}>
                <FaTimes />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperatorReportPage;

