"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../lib/firebaseConfig";
import { FiCalendar, FiCheckCircle, FiXCircle } from "react-icons/fi";
import styles from "./tripcard.module.css";
import dayjs from "dayjs";

export default function TripSummaryCard() {
  const [filterType, setFilterType] = useState("monthly");
  const [completedCount, setCompletedCount] = useState(0);
  const [cancelledCount, setCancelledCount] = useState(0);
  const [dateRangeLabel, setDateRangeLabel] = useState("");

  useEffect(() => {
    const fetchTrips = async () => {
      const userHistoryRef = collection(db, "userHistory");
      const snapshot = await getDocs(userHistoryRef);

      const now = dayjs();
      let startDate = now;
      let label = "";

      if (filterType === "weekly") {
        startDate = now.subtract(7, "day").startOf("day");
        label = `Week: ${startDate.format("MMM D")} - ${now.format("MMM D, YYYY")}`;
      } else if (filterType === "monthly") {
        startDate = now.subtract(1, "month").startOf("day");
        label = `Month: ${now.format("MMMM YYYY")}`;
      } else if (filterType === "yearly") {
        startDate = now.subtract(1, "year").startOf("day");
        label = `Year: ${now.format("YYYY")}`;
      }

      setDateRangeLabel(label);

      let completed = 0;
      let cancelled = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        const tripDate = dayjs(data.date?.toDate());

        if (tripDate.isAfter(startDate)) {
          if (data.status === "completed") completed++;
          if (data.status === "cancelled") cancelled++;
        }
      });

      setCompletedCount(completed);
      setCancelledCount(cancelled);
    };

    fetchTrips();
  }, [filterType]);

  return (
    <div className={styles.container}>
      <div className={styles.top}>
      <h2 className={styles.title}>Trip Summary</h2>

      <div className={styles.filterContainer}>
        <label htmlFor="filter"></label>
        <select
          id="filter"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className={styles.select}
        >
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>
      </div>

      <p className={styles.dateRangeLabel}>
        <FiCalendar className={styles.icon} /> {dateRangeLabel}
      </p>

      <div className={styles.cardContainer}>
        <div className={`${styles.card} ${styles.completedCard}`}>
          <div className={styles.cardHeader}>
            <FiCheckCircle className={styles.cardIcon} />
            <h3>Completed Trips</h3>
          </div>
          <p className={styles.number}>{completedCount}</p>
        </div>
        <div className={`${styles.card} ${styles.cancelledCard}`}>
          <div className={styles.cardHeader}>
            <FiXCircle className={styles.cardIcon} />
            <h3>Cancelled Trips</h3>
          </div>
          <p className={styles.number}>{cancelledCount}</p>
        </div>
      </div>
    </div>
  );
}
