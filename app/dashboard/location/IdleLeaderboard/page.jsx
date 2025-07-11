"use client";
import React, { useEffect, useState } from "react";
import { collection, onSnapshot, getDocs } from "firebase/firestore";
import { db } from "../../../lib/firebaseConfig";
import leaderboardStyles from "./idleLeaderboard.module.css";

const getIdleMinutes = (bus) => {
  if (bus.timestamp && bus.timestamp.toDate) {
    const lastUpdate = bus.timestamp.toDate();
    const now = new Date();
    const diffMs = now - lastUpdate;
    if (diffMs > 0) {
      return Math.floor(diffMs / 60000);
    }
  }
  return 0;
};

const formatIdleTime = (minutes) => {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }
  return `${minutes}m`;
};

const getIdleTextClass = (idleMinutes) => {
  if (idleMinutes > 30) return leaderboardStyles.textRed;
  if (idleMinutes > 10) return leaderboardStyles.textOrange;
  if (idleMinutes >= 5) return leaderboardStyles.textYellow;
  return "";
};

export default function IdleDriversLeaderboard() {
  const [busLocations, setBusLocations] = useState([]);
  const [companyID, setCompanyID] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState("all");

  const fetchDriversStatus = async () => {
    const driversSnapshot = await getDocs(collection(db, "Drivers"));
    const map = {};
    driversSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.companyID) {
        map[doc.id] = {
          companyID: data.companyID,
          status: data.status || "inactive",
        };
      }
    });
    return map;
  };

  const fetchRoutePlateNumbers = async () => {
    const routeSnapshot = await getDocs(collection(db, "Route"));
    const routeMap = {};
    routeSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.driverID && data.plateNumber) {
        routeMap[data.driverID] = data.plateNumber;
      }
    });
    return routeMap;
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCompanyID(localStorage.getItem("companyID"));
    }
  }, []);

  useEffect(() => {
    if (!companyID) return;

    let unsubscribe = null;

    const fetchData = async () => {
      setLoading(true);
      const driversStatusMap = await fetchDriversStatus();
      const routeMap = await fetchRoutePlateNumbers();

      unsubscribe = onSnapshot(collection(db, "BusLocation"), (snapshot) => {
        let buses = snapshot.docs
          .map((doc) => {
            const data = doc.data();
            const driverInfo = driversStatusMap[data.driverID] || {};
            const plateNumber =
              data.plateNumber || routeMap[data.driverID] || "N/A";

            return {
              id: doc.id,
              driverID: data.driverID || "N/A",
              plateNumber,
              timestamp: data.timestamp,
              companyID: driverInfo.companyID,
              driverStatus: driverInfo.status,
            };
          })
          .filter(
            (bus) =>
              bus.companyID === companyID && bus.driverStatus === "active"
          );

        let withIdleTime = buses
          .map((bus) => ({
            ...bus,
            idleMinutes: getIdleMinutes(bus),
          }))
          .filter((bus) => bus.idleMinutes >= 5);

        if (selectedFilter === "5-10") {
          withIdleTime = withIdleTime.filter(
            (bus) => bus.idleMinutes >= 5 && bus.idleMinutes <= 10
          );
        } else if (selectedFilter === "11-30") {
          withIdleTime = withIdleTime.filter(
            (bus) => bus.idleMinutes > 10 && bus.idleMinutes <= 30
          );
        } else if (selectedFilter === "31+") {
          withIdleTime = withIdleTime.filter((bus) => bus.idleMinutes > 30);
        }

        withIdleTime = withIdleTime.sort(
          (a, b) => b.idleMinutes - a.idleMinutes
        );

        setBusLocations(withIdleTime);
        setLoading(false);
      });
    };

    fetchData();

    return () => unsubscribe && unsubscribe();
  }, [companyID, selectedFilter]);

  return (
    <div className={leaderboardStyles.leaderboardCard}>
      <div className={leaderboardStyles.top}>
        <h3 className={leaderboardStyles.title}>Idle Drivers</h3>
        <select
          id="idleFilter"
          value={selectedFilter}
          onChange={(e) => {
            setSelectedFilter(e.target.value);
          }}
          className={leaderboardStyles.selectFilter}
        >
          <option value="all">All</option>
          <option value="5-10">5–10 mins</option>
          <option value="11-30">11–30 mins</option>
          <option value="31+">31+ mins</option>
        </select>
      </div>

      {loading ? (
        <p className={leaderboardStyles.noData}>Loading...</p>
      ) : busLocations.length === 0 ? (
        <p className={leaderboardStyles.noData}>
          No idle drivers found in this category.
        </p>
      ) : (
        <>
          <div className={leaderboardStyles.legend}>
            <div>
              <span
                className={`${leaderboardStyles.legendBox} ${leaderboardStyles.legendRed}`}
              />{" "}
              31+ mins
            </div>
            <div>
              <span
                className={`${leaderboardStyles.legendBox} ${leaderboardStyles.legendOrange}`}
              />{" "}
              11–30 mins
            </div>
            <div>
              <span
                className={`${leaderboardStyles.legendBox} ${leaderboardStyles.legendYellow}`}
              />{" "}
              5–10 mins
            </div>
          </div>

          <div className={leaderboardStyles.tableWrapper}>
            <table className={leaderboardStyles.table}>
              <thead>
                <tr>
                  <th>Driver ID</th>
                  <th>Plate</th>
                  <th>Idle Time</th>
                </tr>
              </thead>
              <tbody>
                {busLocations.map((bus) => (
                  <tr key={bus.id}>
                    <td>{bus.driverID}</td>
                    <td>{bus.plateNumber}</td>
                    <td className={getIdleTextClass(bus.idleMinutes)}>
                      {formatIdleTime(bus.idleMinutes)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
