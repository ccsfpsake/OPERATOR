"use client";

import { useEffect, useState } from "react";
import styles from "./TopDrivers.module.css";
import { db } from "../../../lib/firebaseConfig";
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import { FiCalendar } from "react-icons/fi";
import dayjs from "dayjs";
import Image from "next/image";

const TopDrivers = () => {
  const [topDrivers, setTopDrivers] = useState([]);
  const [timeFilter, setTimeFilter] = useState("daily");
  const [dateLabel, setDateLabel] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopDrivers = async () => {
      setLoading(true);

      const companyID = localStorage.getItem("companyID");
      if (!companyID) {
        setLoading(false);
        return;
      }

      const now = dayjs();
      let startDate;
      let label = "";

      if (timeFilter === "daily") {
        startDate = now.startOf("day");
        label = `Today: ${now.format("MMMM D, YYYY")}`;
      } else if (timeFilter === "weekly") {
        startDate = now.subtract(7, "day").startOf("day");
        label = `Week: ${startDate.format("MMM D")} - ${now.format("MMM D, YYYY")}`;
      } else if (timeFilter === "monthly") {
        startDate = now.subtract(1, "month").startOf("day");
        label = `Month: ${now.format("MMMM YYYY")}`;
      } else if (timeFilter === "yearly") {
        startDate = now.subtract(1, "year").startOf("day");
        label = `Year: ${now.format("YYYY")}`;
      }

      setDateLabel(label);

      const driversSnapshot = await getDocs(collection(db, "Drivers"));
      const driversData = driversSnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((driver) => driver.companyID === companyID);

      const validDriverIDs = driversData.map((d) => d.driverID);

      const unsub = onSnapshot(collection(db, "DriverHistory"), async (snapshot) => {
        const fareMap = {};

        for (const docSnap of snapshot.docs) {
          const driverID = docSnap.id;

          if (!validDriverIDs.includes(driverID)) continue;

          const tripsRef = collection(db, "DriverHistory", driverID, "Trips");
          const tripsSnapshot = await getDocs(tripsRef);

          tripsSnapshot.forEach((tripDoc) => {
            const trip = tripDoc.data();
            const tripDate = trip.createdAt?.toDate();
            const fare = Number(trip.fare) || 0;

            if (tripDate && tripDate >= startDate.toDate()) {
              if (!fareMap[driverID]) fareMap[driverID] = 0;
              fareMap[driverID] += fare;
            }
          });
        }

        const sortedDrivers = Object.entries(fareMap)
          .map(([driverID, totalFare]) => ({ driverID, totalFare }))
          .sort((a, b) => b.totalFare - a.totalFare)
          .slice(0, 5);

        const enrichedDrivers = sortedDrivers.map((d) => {
          const profile = driversData.find((p) => p.driverID === d.driverID);
          return {
            ...d,
            name: profile ? `${profile.FName} ${profile.LName}` : "Unknown",
            imageUrl: profile?.imageUrl || "/default-avatar.png",
          };
        });

        setTopDrivers(enrichedDrivers);
        setLoading(false);
      });

      return () => unsub();
    };

    fetchTopDrivers();
  }, [timeFilter]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Top 5 Drivers</h2>
        <select
          className={styles.select}
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value)}
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>

      <p className={styles.dateLabel}>
        <FiCalendar className={styles.icon} /> {dateLabel}
      </p>

      {loading ? (
        <p className={styles.noData}>Loading...</p>
      ) : topDrivers.length === 0 ? (
        <p className={styles.noData}>No top drivers found for this period.</p>
      ) : (
        <ul className={styles.driverList}>
          {topDrivers.map((driver, index) => (
            <li key={index} className={styles.driverCard}>
              <div className={styles.leftSection}>
                <span className={styles.rank}>{index + 1}</span>
                <Image
                  src={driver.imageUrl || "/noavatar.png"}
                  alt={driver.name || "Driver Avatar"}
                  width={46}
                  height={46}
                  className={styles.avatar}
                />
                <span className={styles.name}>{driver.name}</span>
              </div>
              <div className={styles.rightSection}>
              ₱{" "}
              {Number(driver.totalFare) % 1 === 0
                ? Number(driver.totalFare).toLocaleString()
                : Number(driver.totalFare).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
              })}

              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TopDrivers;
