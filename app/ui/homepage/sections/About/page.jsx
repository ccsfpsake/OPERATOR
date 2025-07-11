"use client";

import { useState, useEffect } from "react";
import { db } from "../../../../lib/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import styles from "./about.module.css";

const About = () => {
  const [aboutUsData, setAboutUsData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRef = doc(db, "Setting", "About Us");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setAboutUsData(docSnap.data());
        } else {
          setError("No data found.");
        }
      } catch (error) {
        setError("Error fetching data.");
      }
    };

    fetchData();
  }, []);

  if (error) {
    return <p className={styles.error}>{error}</p>;
  }

  return (
    <section id="about" className={styles.aboutSection}>
      <div className={styles.wrapper}>
        <div className={styles.textSection}>
          <h2>About Us</h2>
          <p>{aboutUsData?.AboutUs}</p>
        </div>

        <div className={styles.extraInfo}>
          <div className={styles.card}>
            <h3>Mission</h3>
            <p>{aboutUsData?.Mission}</p>
          </div>
          <div className={styles.card}>
            <h3>Vision</h3>
            <p>{aboutUsData?.Vision}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
