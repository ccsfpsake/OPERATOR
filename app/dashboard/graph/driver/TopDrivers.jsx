"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../../lib/firebaseConfig";
import styles from "./TopDrivers.module.css";
import dayjs from "dayjs";
import { FiCalendar } from "react-icons/fi";
import isoWeek from "dayjs/plugin/isoWeek";
import weekday from "dayjs/plugin/weekday";
import localeData from "dayjs/plugin/localeData";

dayjs.extend(isoWeek);
dayjs.extend(weekday);
dayjs.extend(localeData);

const groupByPeriod = (date, type) => {
  switch (type) {
    case "day":
      return dayjs(date).format("YYYY-MM-DD");
    case "week":
      return `Week ${dayjs(date).isoWeek()} - ${dayjs(date).year()}`;
    case "month":
      return dayjs(date).format("MMMM YYYY");
    case "year":
      return dayjs(date).format("YYYY");
    default:
      return "";
  }
};

const getFormattedDateLabel = (period, referenceDate) => {
  const date = dayjs(referenceDate);
  switch (period) {
    case "day":
      return date.format("MMMM D, YYYY");
    case "week":
      return `${date.startOf("isoWeek").format("MMMM D")} – ${date.endOf("isoWeek").format("D, YYYY")}`;
    case "month":
      return `${date.startOf("month").format("MMMM D")} – ${date.endOf("month").format("D, YYYY")}`;
    case "year":
      return date.format("YYYY");
    default:
      return "";
  }
};

const isInPeriod = (date, period) => {
  const now = dayjs();
  const target = dayjs(date);
  switch (period) {
    case "day":
      return target.isSame(now, "day");
    case "week":
      return target.isSame(now, "isoWeek");
    case "month":
      return target.isSame(now, "month");
    case "year":
      return target.isSame(now, "year");
    default:
      return false;
  }
};

const TopDriversGrouped = () => {
  const [groupedDrivers, setGroupedDrivers] = useState({
    day: [],
    week: [],
    month: [],
    year: [],
  });
  const [selectedPeriod, setSelectedPeriod] = useState("day");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const companyID = localStorage.getItem("companyID");
    if (!companyID) return;

    const fetchAndGroupDrivers = async () => {
      setLoading(true);
      try {
        const driversQuery = query(
          collection(db, "Drivers"),
          where("companyID", "==", companyID)
        );
        const driversSnap = await getDocs(driversQuery);

        const periods = ["day", "week", "month", "year"];
        const fareGroups = {
          day: {},
          week: {},
          month: {},
          year: {},
        };

        for (const doc of driversSnap.docs) {
          const driver = doc.data();
          const driverID = driver.driverID;
          const name = `${driver.FName} ${driver.LName}`;
          const image = driver.imageUrl || "/default-avatar.png";
          const salesRef = collection(db, `dailysales/${driverID}/dailysales`);
          const salesSnap = await getDocs(salesRef);

          salesSnap.forEach((saleDoc) => {
            const sale = saleDoc.data();
            const fare = Number(sale.totals?.totalTicketAmountDetails || 0);
            const firstDateStr = sale.firstDate;
            const lastDateStr = sale.lastDate;

            if (!firstDateStr || !lastDateStr || fare === 0) return;

            const start = dayjs(firstDateStr);
            const end = dayjs(lastDateStr);
            if (!start.isValid() || !end.isValid()) return;

            const daysCount = end.diff(start, "day") + 1;
            const farePerDay = fare / daysCount;

            for (let d = 0; d < daysCount; d++) {
              const currentDate = start.add(d, "day");

              for (const period of periods) {
                if (!isInPeriod(currentDate, period)) continue;

                const key = groupByPeriod(currentDate, period);
                const groupKey = `${key}-${driverID}`;

                if (!fareGroups[period][groupKey]) {
                  fareGroups[period][groupKey] = {
                    driverID,
                    name,
                    image,
                    periodKey: key,
                    totalFare: 0,
                  };
                }

                fareGroups[period][groupKey].totalFare += farePerDay;
              }
            }
          });
        }

        const result = {};
        for (const period of periods) {
          const grouped = Object.values(fareGroups[period]);
          const sorted = grouped
            .sort((a, b) => b.totalFare - a.totalFare)
            .slice(0, 3);
          result[period] = sorted;
        }

        setGroupedDrivers(result);
      } catch (error) {
        console.error("Error fetching top drivers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAndGroupDrivers();
  }, []);

  const currentTop = groupedDrivers[selectedPeriod];
  const dateLabel = getFormattedDateLabel(selectedPeriod, new Date());

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}>Top 3 Drivers</div>
        <select
          className={styles.select}
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
        >
          <option value="day">Daily</option>
          <option value="week">Weekly</option>
          <option value="month">Monthly</option>
          <option value="year">Yearly</option>
        </select>
      </div>

      {loading ? (
        <div className={styles.noData}>Loading...</div>
      ) : currentTop.length === 0 ? (
        <div className={styles.noData}>No data found for this period.</div>
      ) : (
        <>
          <p className={styles.dateLabel}>
            <FiCalendar className={styles.icon} /> {dateLabel}
          </p>
          <ul className={styles.driverList}>
            {currentTop.map((driver, index) => (
              <li className={styles.driverCard} key={`${selectedPeriod}-${index}`}>
                <div className={styles.leftSection}>
                  <div className={styles.rank}>{index + 1}</div>
                  <img
                    src={driver.image}
                    alt={driver.name}
                    className={styles.avatar}
                  />
                  <div className={styles.name}>{driver.name}</div>
                </div>
                <div className={styles.rightSection}>
                  ₱{Math.round(driver.totalFare).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default TopDriversGrouped;
