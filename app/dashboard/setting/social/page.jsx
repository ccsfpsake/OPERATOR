"use client";

import { useState, useEffect } from "react";
import { db } from "../../../../app/lib/firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import styles from "../../../../app/ui/dashboard/setting/socialmedia.module.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const SocialMediaPage = () => {
  const [socialMediaData, setSocialMediaData] = useState({
    Facebook: "",
    Instagram: "",
    YouTube: "",
    Email: "",
    Phone: "",
  });

  const [originalData, setOriginalData] = useState({});
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRef = doc(db, "Setting", "Social Media Accounts");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setSocialMediaData(docSnap.data());
          setOriginalData(docSnap.data());
        } else {
          toast.dismiss(); 
          toast.error("No data found.", { autoClose: 3000 });
        }
      } catch (error) {
        toast.dismiss();
        toast.error("Error fetching data.", { autoClose: 3000 });
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSocialMediaData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const hasChanges = Object.keys(socialMediaData).some(
      (key) => socialMediaData[key] !== originalData[key]
    );

    if (!hasChanges) {
      toast.dismiss();
      toast.warning("No changes detected.", { autoClose: 3000 });
      return;
    }

    try {
      const docRef = doc(db, "Setting", "Social Media Accounts");
      await setDoc(docRef, socialMediaData);

      toast.dismiss();
      toast.success("Social Media Accounts updated successfully.", { autoClose: 3000 });
      setOriginalData(socialMediaData);
    } catch (error) {
      toast.dismiss();
      toast.error("Error updating data.", { autoClose: 3000 });
      console.error("Error updating data:", error);
    }
  };

  return (
    <div className={styles.socialMediaContainer}>
      <ToastContainer position="top-right" autoClose={3000} />
      <form onSubmit={handleSubmit} className={styles.form}>
        {Object.keys(socialMediaData).map((field) => (
          <div className={styles.formGroup} key={field}>
            <label htmlFor={field} className={styles.label}>{field}</label>
            <input
              type="text"
              id={field}
              name={field}
              value={socialMediaData[field]}
              onChange={handleChange}
              className={styles.input}
              required
            />
          </div>
        ))}
        <button type="submit" className={styles.button}>Save Changes</button>
      </form>
    </div>
  );
};

export default SocialMediaPage;
