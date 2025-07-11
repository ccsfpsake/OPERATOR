"use client";
import { useEffect, useRef, useState } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Image from "next/image";
import { db } from "../../../lib/firebaseConfig";
import moment from "moment";
import styles from "./chatbox.module.css";
import { FaPaperPlane, FaDownload, FaTimes } from "react-icons/fa";

const ChatBox = ({ companyID }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [typing, setTyping] = useState(false);
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [modalSrc, setModalSrc] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [modalFileName, setModalFileName] = useState(null);
  const [visibleTimestamps, setVisibleTimestamps] = useState([]);

  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (!companyID) return;
    const q = query(collection(db, "Chat", companyID, "messages"), orderBy("createdAt", "asc"));

    const unsub = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMessages(fetched);
      fetched.forEach((msg) => {
        if (!msg.seen && msg.senderRole !== "admin") {
          updateDoc(doc(db, "Chat", companyID, "messages", msg.id), { seen: true });
        }
      });
    });

    const typingRef = doc(db, "Chat", companyID, "typing", "operator");
    const unsubTyping = onSnapshot(typingRef, (snap) => {
      setTyping(snap.exists() && snap.data().isTyping);
    });

    return () => {
      unsub();
      unsubTyping();
    };
  }, [companyID]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!companyID) return;
    const typingDoc = doc(db, "Chat", companyID, "typing", "admin");
    setDoc(typingDoc, { isTyping: newMessage.trim().length > 0 });
    const timeout = setTimeout(() => setDoc(typingDoc, { isTyping: false }), 2000);
    return () => clearTimeout(timeout);
  }, [newMessage, companyID]);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
      setFileType(selected.type.startsWith("image/") ? "image" : "document");
    };
    reader.readAsDataURL(selected);
    setFile(selected);
  };

  const sendMessage = async () => {
  if ((!newMessage.trim() && !file) || !companyID) return;
  const messagesRef = collection(db, "Chat", companyID, "messages");

  let imageUrl = "";
  let docUrl = "";
  let filename = "";

  // 🔵 Upload the file to Firebase Storage if a file is selected
  if (file) {
    try {
      const storage = getStorage();
      const filePath = `chat_files/${companyID}/${Date.now()}_${file.name}`;
      const fileRef = ref(storage, filePath);
      await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(fileRef);

      if (fileType === "image") {
        imageUrl = downloadURL;
      } else {
        docUrl = downloadURL;
        filename = file.name;
      }
    } catch (error) {
      console.error("File upload error:", error);
      return;
    }
  }

  const newMsg = {
    text: newMessage,
    imageUrl,
    docUrl,
    filename,
    senderRole: "admin",
    createdAt: serverTimestamp(),
    seen: false,
    status: "sending",
  };

  try {
    const docRef = await addDoc(messagesRef, newMsg);
    await updateDoc(docRef, { status: "delivered" });
  } catch (err) {
    console.error("Message failed to send:", err);
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

  const formatTime = (ts) => moment(ts?.toDate()).format("h:mm A");
  const formatDate = (ts) => moment(ts?.toDate()).format("MMMM D, YYYY");
  const shouldShowDate = (current, previous) => {
    if (!previous) return true;
    return moment(current?.toDate()).format("YYYY-MM-DD") !== moment(previous?.toDate()).format("YYYY-MM-DD");
  };

  return (
    <div className={styles.chatWrapper}>
      <div className={styles.chatHeader}>Chat with CPOSCO</div>
      <div className={styles.chatBox}>
        {messages.map((msg, i) => {
          const prev = messages[i - 1];
          const isAdmin = msg.senderRole === "admin";
          const isLastAdminMsg = isAdmin && i === messages.length - 1;

          return (
            <div key={msg.id}>
              {shouldShowDate(msg.createdAt, prev?.createdAt) && (
                <div className={styles.dateDivider}>{formatDate(msg.createdAt)}</div>
              )}
              {visibleTimestamps.includes(msg.id) && (
                <div className={styles.timestampTopCenter}>{formatTime(msg.createdAt)}</div>
              )}
              <div
                className={`${styles.messageRow} ${isAdmin ? styles.right : styles.left}`}
                onClick={() => toggleTimestamp(msg.id)}
              >
                <div className={styles.messageBubble}>
                  {msg.text && <p>{msg.text}</p>}
                  {msg.imageUrl && (
                  <Image
                    src={msg.imageUrl}
                    alt="Chat image"
                    className={styles.media}
                    width={300}
                    height={200}
                    unoptimized
                    onClick={() => {
                      setModalSrc(msg.imageUrl);
                      setModalType("image");
                    }}
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
              {isLastAdminMsg && (
                <div className={styles.statusBottom}>
                  {msg.status === "sending" && <span>Sending...</span>}
                  {msg.status === "delivered" && !msg.seen && <span>Delivered</span>}
                  {msg.seen && <span>Seen</span>}
                </div>
              )}
            </div>
          );
        })}
        {typing && <div className={styles.typingIndicator}>typing...</div>}
        <div ref={chatEndRef} />
      </div>

      <div className={styles.inputArea}>
        <button className={styles.addButton} onClick={() => fileInputRef.current.click()}>
          +
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
          ref={fileInputRef}
          style={{ display: "none" }}
        />
        <button className={styles.sendButton} onClick={sendMessage} disabled={!newMessage.trim() && !file}>
          <FaPaperPlane />
        </button>
      </div>

      {modalSrc && (
        <div className={styles.modalOverlay} onClick={() => setModalSrc(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            {modalType === "image" ? (
              <Image
                src={modalSrc}
                alt="Full image"
                className={styles.fullMedia}
                width={600}
                height={400}
                unoptimized
              />
            ) : (
              <iframe src={modalSrc} className={styles.fullMedia} title="Document Preview" />
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
              {preview && (
          <div className={styles.previewAttachment}>
            {fileType === "image" ? (
              <Image
                src={preview}
                alt="Preview"
                className={styles.preview}
                width={100}
                height={100}
                unoptimized
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
  );
};

export default ChatBox;

