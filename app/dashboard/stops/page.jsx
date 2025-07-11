"use client";

import { useEffect, useState } from "react";
import { db } from "../../lib/firebaseConfig";
import { collection, onSnapshot } from "firebase/firestore";
import BusStopsPage from "./BusStopsPage";
import styles from "../../ui/dashboard/stops/index.module.css";
import { FaArrowLeftLong } from "react-icons/fa6";

const StopsIndexPage = () => {
  const [lines, setLines] = useState([]);
  const [selectedLineId, setSelectedLineId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "Lines"), (snapshot) => {
      const linesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setLines(linesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.containercard}>
        {!selectedLineId ? (
          <>
            <h2>Select a Route</h2>
            {loading ? (
              <p className={styles.loading}>Loading routes...</p> 
            ) : (
              <div className={styles.cardGrid}>
                {lines.map((line) => (
                  <div
                    key={line.id}
                    className={styles.lineCard}
                    onClick={() => setSelectedLineId(line.id)}
                  >
                    <h3>{line.name || line.id}</h3>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div className={styles.backButtonWrapper}>
              <button
                className={styles.backButton}
                onClick={() => setSelectedLineId(null)}
              >
                <FaArrowLeftLong />
              </button>
            </div>
            <BusStopsPage lineId={selectedLineId} />
          </>
        )}
      </div>
    </div>
  );
};

export default StopsIndexPage;
