'use client';

import { useState, useEffect } from 'react';
import { db } from '../../../app/lib/firebaseConfig'; 
import { doc, getDoc, setDoc } from 'firebase/firestore';
import styles from '../../../app/ui/dashboard/fare/fare.module.css';

export default function FareSettings() {
  const [baseFare, setBaseFare] = useState(15);
  const [baseKm, setBaseKm] = useState(4);
  const [additionalPerKm, setAdditionalPerKm] = useState(2.2);
  const [discount, setDiscount] = useState(0.2); 
  const [effectiveDate, setEffectiveDate] = useState('2023-10-08');
  const [fareTable, setFareTable] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const ref = doc(db, 'Farematrix', 'aircon_puj');
      const snapshot = await getDoc(ref);
      if (snapshot.exists()) {
        const data = snapshot.data();
        setBaseFare(data.baseFare);
        setBaseKm(data.baseKm);
        setAdditionalPerKm(data.additionalPerKm);
        setDiscount(data.discount);
        setEffectiveDate(data.effectiveDate);
        setFareTable(data.fareTable || []);
      }
    };
    fetchData();
  }, []);

  const generateFareTable = () => {
    const table = [];
    for (let km = 1; km <= 50; km++) {
      let fare = km <= baseKm
        ? baseFare
        : baseFare + (km - baseKm) * additionalPerKm;

      fare = Math.round(fare * 4) / 4; 
      const discounted = Math.round(fare * (1 - discount) * 4) / 4;

      table.push({
        km,
        regular: fare,
        discounted: discounted,
      });
    }
    setFareTable(table);
  };

  const handleSave = async () => {
    const docRef = doc(db, 'Farematrix', 'aircon_puj');
    await setDoc(docRef, {
      baseFare,
      baseKm,
      additionalPerKm,
      discount,
      effectiveDate,
      fareTable,
    });
    alert('Fare configuration saved!');
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>PUJ (Modern and Electric Airconditioned)</h1>

      <div className={styles.grid}>
        <label>
          <span className={styles.label}>Base Fare (₱)</span>
          <input type="number" step="0.25" value={baseFare} onChange={e => setBaseFare(parseFloat(e.target.value))} className={styles.input} />
        </label>

        <label>
          <span className={styles.label}>Base Kilometers</span>
          <input type="number" value={baseKm} onChange={e => setBaseKm(parseInt(e.target.value))} className={styles.input} />
        </label>

        <label>
          <span className={styles.label}>Additional Fare per Km (₱)</span>
          <input type="number" step="0.01" value={additionalPerKm} onChange={e => setAdditionalPerKm(parseFloat(e.target.value))} className={styles.input} />
        </label>

        <label>
          <span className={styles.label}>Discount (Student / Elderly / Disabled)</span>
          <input type="number" step="0.01" value={discount} onChange={e => setDiscount(parseFloat(e.target.value))} className={styles.input} />
        </label>

        <label className={styles.fullWidth}>
          <span className={styles.label}>Effective Date</span>
          <input type="date" value={effectiveDate} onChange={e => setEffectiveDate(e.target.value)} className={styles.input} />
        </label>
      </div>

      <div className={styles.buttonGroup}>
        <button onClick={generateFareTable} className={`${styles.button} ${styles.blue}`}>Generate Fare Table</button>
        <button onClick={handleSave} className={`${styles.button} ${styles.green}`}>Save to Firestore</button>
      </div>

      {fareTable.length > 0 && (
        <div className={styles.tableContainer}>
          <h2 className={styles.subtitle}>Generated Fare Table</h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>KM</th>
                <th>Regular</th>
                <th>Discounted (Student / Elderly / Disabled)</th>
              </tr>
            </thead>
            <tbody>
              {fareTable.map(({ km, regular, discounted }) => (
                <tr key={km}>
                  <td>{km}</td>
                  <td>₱{regular.toFixed(2)}</td>
                  <td>₱{discounted.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
