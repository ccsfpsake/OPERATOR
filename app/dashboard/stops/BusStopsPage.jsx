"use client";

import { useEffect, useState } from "react";
import { db } from "../../lib/firebaseConfig";
import { collection, onSnapshot } from "firebase/firestore";
import styles from "../../../app/ui/dashboard/stops/stops.module.css";
import Pagination from "../../../app/ui/dashboard/pagination/pagination";

const BusStopsPage = ({ lineId }) => {
  const [busStops, setBusStops] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const stopsPerPage = 10;

  useEffect(() => {
    if (!lineId) return;

    const stopsRef = collection(db, "Bus Stops", lineId, "Stops");

    const unsubscribe = onSnapshot(stopsRef, (snapshot) => {
      const stops = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      stops.sort((a, b) => {
      const numA = parseInt(a.locID.replace(/[^\d]/g, ""), 10);
      const numB = parseInt(b.locID.replace(/[^\d]/g, ""), 10);
        return numA - numB;
      });

      setBusStops(stops);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [lineId]);

  const indexOfLastStop = currentPage * stopsPerPage;
  const indexOfFirstStop = indexOfLastStop - stopsPerPage;
  const currentStops = busStops.slice(indexOfFirstStop, indexOfLastStop);
  const totalPages = Math.ceil(busStops.length / stopsPerPage);

  return (
    <div className={styles.busStopContainer}>
      <div className={styles.headerRow}>
        <h2>{lineId}</h2>
      </div>

      {loading ? (
        <p>Loading stops...</p>
      ) : busStops.length === 0 ? (
        <p>No stops found.</p>
      ) : (
        <>
          <div className={styles["table-wrapper"]}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Location ID</th>
                  <th>Name</th>
                  <th>Latitude</th>
                  <th>Longitude</th>
                </tr>
              </thead>
              <tbody>
                {currentStops.map((stop) => (
                  <tr key={stop.id}>
                    <td>{stop.locID}</td>
                    <td>{stop.name}</td>
                    <td>{stop.geo?.latitude ?? "N/A"}</td>
                    <td>{stop.geo?.longitude ?? "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </>
      )}
    </div>
  );
};

export default BusStopsPage;
