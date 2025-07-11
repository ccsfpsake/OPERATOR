
"use client"

import { useState, useEffect } from 'react';
import { db } from '../../lib/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import styles from '../../ui/dashboard/terms/terms.module.css'; 

const TermsOfUse = () => {
  const [aboutUsData, setAboutUsData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRef = doc(db, 'Setting', 'Terms of Use for operator'); 
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setAboutUsData(docSnap.data()); 
        } else {
          setError('No data found.');
        }
      } catch (error) {
        setError('Error fetching data.');
      }
    };

    fetchData();
  }, []);

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div>
      <main>
        <div className={styles.container}>
            <section>
            <h1 className={styles.heading}>Terms OF Use</h1>
          </section>
          <section>
            <h2 className={styles.subheading}>Operational Oversight</h2>
            <p className={styles.paragraph}>{aboutUsData?.Operational_Oversight}</p>
          </section>
          <section>
            <h2 className={styles.subheading}>Data Monitoring and Analytics</h2>
            <p className={styles.paragraph}>{aboutUsData?.Data_Monitoring_and_Analytics}</p>
          </section>
          <section>
            <h2 className={styles.subheading}>Data Security and Compliance</h2>
            <p className={styles.paragraph}>{aboutUsData?.Data_Security_and_Compliance}</p>
          </section>
          <section>
            <h2 className={styles.subheading}>Confidentiality and Ethical Responsibility </h2>
            <p className={styles.paragraph}>{aboutUsData?.Confidentiality_and_Ethical_Responsibility}</p>
          </section>
          <section>
            <h2 className={styles.subheading}>Driver Account Management  </h2>
            <p className={styles.paragraph}>{aboutUsData?.Driver_Account_Management }</p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default TermsOfUse;

