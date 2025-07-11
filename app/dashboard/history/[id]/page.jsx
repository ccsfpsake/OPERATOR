"use client";
/* global Set */
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../../lib/firebaseConfig";
import styles from "../../../../app/ui/dashboard/history/viewhistory.module.css";
import Search from "../../../../app/ui/dashboard/search/search";
import React from "react";

const DriverHistoryPage = () => {
  const { id: driverID } = useParams();
  const [driver, setDriver] = useState(null);
  const [dailyTrips, setDailyTrips] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedDates, setExpandedDates] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const companyID = localStorage.getItem("companyID");
    if (!driverID || !companyID) return;

    const fetchDriverAndTrips = async () => {
      try {
        setLoading(true);

        const driverQuery = query(
          collection(db, "Drivers"),
          where("driverID", "==", driverID),
          where("companyID", "==", companyID)
        );
        const driverSnap = await getDocs(driverQuery);
        if (!driverSnap.empty) {
          setDriver(driverSnap.docs[0].data());
        }

        const tripsRef = collection(db, `DriverHistory/${driverID}/Trips`);
        const tripSnap = await getDocs(tripsRef);
        const trips = tripSnap.docs.map((doc) => doc.data());

        const grouped = {};
        trips.forEach((trip) => {
          if (!trip.createdAt?.toDate) return;
          const dateObj = trip.createdAt.toDate();
          const dateKey = dateObj.toISOString().split("T")[0];

          if (!grouped[dateKey]) {
            grouped[dateKey] = {
              dateKey,
              displayDate: dateObj.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              }),
              timestamp: dateObj,
              trips: [],
              totalPassengers: 0,
              totalFare: 0,
              routes: new Set(),
            };
          }

          grouped[dateKey].trips.push(trip);
          grouped[dateKey].totalPassengers += Number(trip.TotalPassengers) || 0;
          grouped[dateKey].totalFare += Number(trip.fare) || 0;

          const routeLabel =
            trip.start && trip.destination
              ? `${trip.start} - ${trip.destination}`
              : trip.route ?? "Unknown Route";
          grouped[dateKey].routes.add(routeLabel);
        });

        const dailyList = Object.values(grouped)
          .map((day) => ({
            ...day,
            routes: [...day.routes],
            trips: day.trips.sort((a, b) => {
              const timeA = a.createdAt?.toDate?.().getTime() || 0;
              const timeB = b.createdAt?.toDate?.().getTime() || 0;
              return timeA - timeB; 
            }),
          }))
          .sort((a, b) => b.timestamp - a.timestamp);
        setDailyTrips(dailyList);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDriverAndTrips();
  }, [driverID]);

  const toggleExpand = (dateKey) => {
    setExpandedDates((prev) => ({
      ...prev,
      [dateKey]: !prev[dateKey],
    }));
  };

  const filteredDailyTrips = dailyTrips.filter((day) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      day.displayDate.toLowerCase().includes(searchLower) ||
      day.totalPassengers.toString().includes(searchLower) ||
      day.totalFare.toString().includes(searchLower) ||
      day.routes.some((route) => route?.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className={styles.container}>
      <div className={styles.top}>
        {driver ? (
          <h3>
            Driver: {driver.FName} {driver.LName}
          </h3>
        ) : (
          <h3>Loading driver information...</h3>
        )}
        <Search
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Route</th>
              <th>Total Passengers</th>
              <th>Total Fare</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className={styles.noData}>
                  Loading...
                </td>
              </tr>
            ) : filteredDailyTrips.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.noData}>
                  No trip history found.
                </td>
              </tr>
            ) : (
              filteredDailyTrips.map((day, index) => {
                const bgClass = index % 2 === 0 ? styles.bgDay1 : styles.bgDay2;
                const isExpanded = expandedDates[day.dateKey];

                return (
                  <React.Fragment key={day.dateKey}>
                    <tr
                      className={bgClass}
                      onClick={() => toggleExpand(day.dateKey)}
                      style={{ cursor: "pointer" }}
                    >
                      <td>
                        <div className={styles.dateCell}>
                          <span className={styles.arrow}>
                            {isExpanded ? "▼" : "►"}
                          </span>
                          <span>{day.displayDate}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: "left", paddingLeft: "25px", fontStyle: "italic" }}>
                        {day.routes.join(", ")}
                      </td>
                      <td style={{ textAlign: "right" }}>{day.totalPassengers}</td>
                      <td style={{ textAlign: "right" }}>
                        ₱{day.totalFare.toLocaleString()}
                      </td>
                    </tr>

                    {isExpanded &&
                      day.trips.map((trip, i) => (
                        <tr key={`${day.dateKey}-${i}`} className={styles.subRow}>
                          <td style={{ paddingLeft: "25px", fontStyle: "italic" }}>
                            {trip.createdAt?.toDate().toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            }) ?? "N/A"}
                          </td>
                          <td style={{ fontStyle: "italic" }}>
                            {trip.start && trip.destination
                              ? `${trip.start} - ${trip.destination}`
                              : trip.route ?? ""}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            {trip.TotalPassengers ?? "N/A"}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            ₱{Number(trip.fare || 0).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DriverHistoryPage;
