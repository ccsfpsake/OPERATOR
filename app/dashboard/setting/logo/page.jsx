"use client";

import { useState, useEffect } from "react";
import { db } from "../../../../app/lib/firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getStorage, ref, getDownloadURL, uploadBytes, deleteObject } from "firebase/storage";
import styles from "../../../../app/ui/dashboard/setting/systemlogo.module.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Image from "next/image";

const SystemLogoPage = () => {
  const [logos, setLogos] = useState({ logow: null, logo: null });
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [selectedLogoType, setSelectedLogoType] = useState("logow");

  useEffect(() => {
    const fetchLogos = async () => {
      try {
        const storage = getStorage();
        const logowRef = ref(storage, "Logo/logow.png");
        const logoRef = ref(storage, "Logo/Logo.png");

        const logowURL = await getDownloadURL(logowRef);
        const logoURL = await getDownloadURL(logoRef);

        setLogos({ logow: logowURL, logo: logoURL });
      } catch (error) {
        console.error("Error fetching logos:", error);
        toast.error("Error fetching logos.", { autoClose: 2000 });
      }
    };

    fetchLogos();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.warning("Please select a file.", { autoClose: 2000 });
      return;
    }

    try {
      const storage = getStorage();
      const oldLogoRef = ref(storage, `Logo/${selectedLogoType}.png`);
      const newLogoRef = ref(storage, `Logo/${selectedLogoType}.png`);

      try {
        await deleteObject(oldLogoRef);
      } catch (error) {
        console.warn("Old logo not found or already deleted.");
      }

      await uploadBytes(newLogoRef, selectedFile);

      const newURL = await getDownloadURL(newLogoRef);

      const docRef = doc(db, "Setting", "SystemLogo");
      await setDoc(docRef, { [selectedLogoType]: newURL }, { merge: true });

      setLogos((prev) => ({ ...prev, [selectedLogoType]: newURL }));
      setSelectedFile(null);
      setPreview(null);

      toast.success("Logo updated successfully!", { autoClose: 2000 });
    } catch (error) {
      console.error("Error updating logo:", error);
      toast.error("Error updating logo.", { autoClose: 2000 });
    }
  };

  return (
    <div className={styles.systemLogoContainer}>
      <ToastContainer position="top-right" autoClose={2000} />
      <h2>System Logo Settings</h2>

      <div className={styles.logoPreview}>
        <div>
          <h4>White Logo (logow.png)</h4>
          {logos.logow ? (
            <Image
            src={logos.logow}
            alt="White Logo"
            className={styles.logoImage}
            width={150}
            height={75}
          />

          ) : (
            <p>Loading...</p>
          )}
        </div>
        <div>
          <h4>Colored Logo (Logo.png)</h4>
          {logos.logo ? (
          <Image
            src={logos.logo}
            alt="Colored Logo"
            className={styles.logoImage}
            width={150}
            height={75}
          />
          ) : (
            <p>Loading...</p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label>Select Logo Type:</label>
          <select value={selectedLogoType} onChange={(e) => setSelectedLogoType(e.target.value)} className={styles.select}>
            <option value="logow">White Logo (logow.png)</option>
            <option value="Logo">Colored Logo (Logo.png)</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label>Upload New Logo:</label>
          <input type="file" accept="image/*" onChange={handleFileChange} className={styles.input} />
        </div>

        {preview && (
          <div className={styles.previewContainer}>
            <h4>New Logo Preview</h4>
           <Image
            src={preview}
            alt="Preview"
            className={styles.previewImage}
            width={150}
            height={75}
          />
          </div>
        )}

        <button type="submit" className={styles.button}>Save Changes</button>
      </form>
    </div>
  );
};

export default SystemLogoPage;
