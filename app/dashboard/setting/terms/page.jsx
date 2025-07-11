"use client";

import { useState, useEffect } from "react";
import { db } from "../../../../app/lib/firebaseConfig";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import styles from "../../../../app/ui/dashboard/setting/termsofuse.module.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const TermsOfUsePage = () => {
  const [termsOfUse, setTermsOfUse] = useState("");
  const [dateUpdated, setDateUpdated] = useState("");
  const [originalData, setOriginalData] = useState({ terms: "", date: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTermsOfUse = async () => {
      try {
        const docRef = doc(db, "Setting", "Terms of Use");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const terms = data.Terms || "";
          const date = data["Date Updated"]?.toDate().toISOString().slice(0, 16) || "";

          setTermsOfUse(terms);
          setDateUpdated(date);
          setOriginalData({ terms, date });
        } else {
          setError("No data found.");
          toast.error("No data found.");
        }
      } catch (error) {
        setError("Error fetching data.");
        toast.error("Error fetching data.");
        console.error("Error fetching data:", error);
      }
    };

    fetchTermsOfUse();
  }, []);

  const handleSave = async () => {
    if (termsOfUse === originalData.terms && dateUpdated === originalData.date) {
      toast.warning("No changes detected.");
      return;
    }

    if (!termsOfUse.trim()) {
      toast.error("Terms of Use cannot be empty.");
      return;
    }

    try {
      const docRef = doc(db, "Setting", "Terms of Use");
      await updateDoc(docRef, {
        Terms: termsOfUse,
        "Date Updated": Timestamp.fromDate(new Date(dateUpdated)),
      });

      toast.success("Terms of Use updated successfully.");
      setOriginalData({ terms: termsOfUse, date: dateUpdated });
    } catch (error) {
      toast.error("Error updating Terms of Use.");
      console.error("Error updating Terms of Use:", error);
    }
  };

  return (
    <div className={styles.container}>
      <ToastContainer position="top-right" autoClose={3000} />
      {error && <p className={styles.error}>{error}</p>}
      <label>Date Updated:</label>
      <input
        type="datetime-local"
        value={dateUpdated || ""}
        onChange={(e) => setDateUpdated(e.target.value)}
      />

      <label>Terms of Use:</label>
      <textarea
        value={termsOfUse || ""}
        onChange={(e) => setTermsOfUse(e.target.value)}
      />

      <button onClick={handleSave}>Save</button>
    </div>
  );
};

export default TermsOfUsePage;
