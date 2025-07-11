"use client";

import { useState, useEffect } from "react";
import { db } from "../../../../app/lib/firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes } from "firebase/storage";
import styles from "../../../../app/ui/dashboard/setting/aboutus.module.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AboutUsEditPage = () => {
  const [aboutUsData, setAboutUsData] = useState({
    AboutUs: "",
    Mission: "",
    Vision: "",
  });

  const [originalData, setOriginalData] = useState({});
  const [logoFile, setLogoFile] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRef = doc(db, "Setting", "About Us");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setAboutUsData(data);
          setOriginalData(data);
        } else {
          toast.error("No data found.", { autoClose: 3000 });
        }
      } catch (error) {
        toast.error("Error fetching data.", { autoClose: 3000 });
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAboutUsData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const hasChanges = Object.keys(aboutUsData).some(
      (key) => aboutUsData[key] !== originalData[key]
    );

    if (!hasChanges && !logoFile) {
      toast.warning("No changes detected.", { autoClose: 3000 });
      return;
    }

    if (!aboutUsData.AboutUs.trim() || !aboutUsData.Mission.trim() || !aboutUsData.Vision.trim()) {
      toast.error("All fields are required.", { autoClose: 3000 });
      return;
    }

    try {
      const docRef = doc(db, "Setting", "About Us");
      await setDoc(docRef, aboutUsData);

      if (logoFile) {
        const storage = getStorage();
        const imageRef = ref(storage, "Logo/logow.png");
        await uploadBytes(imageRef, logoFile);
      }

      setOriginalData(aboutUsData);
      setLogoFile(null);
      toast.success("About Us updated successfully.", { autoClose: 3000 });
    } catch (error) {
      toast.error("Error updating data.", { autoClose: 3000 });
      console.error("Error updating data:", error);
    }
  };

  return (
    <div className={styles.aboutUsEditContainer}>
      <ToastContainer position="top-right" autoClose={3000} />
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="AboutUs" className={styles.label}>About Us</label>
          <textarea
            id="AboutUs"
            name="AboutUs"
            value={aboutUsData.AboutUs}
            onChange={handleChange}
            className={styles.textarea}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="Mission" className={styles.label}>Mission</label>
          <textarea
            id="Mission"
            name="Mission"
            value={aboutUsData.Mission}
            onChange={handleChange}
            className={styles.textarea}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="Vision" className={styles.label}>Vision</label>
          <textarea
            id="Vision"
            name="Vision"
            value={aboutUsData.Vision}
            onChange={handleChange}
            className={styles.textarea}
            required
          />
        </div>
        <button type="submit" className={styles.button}>Save Changes</button>
      </form>
    </div>
  );
};

export default AboutUsEditPage;
