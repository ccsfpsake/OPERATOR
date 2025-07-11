"use client";

import { useEffect, useState } from "react";
import { db } from "../../../lib/firebaseConfig";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import styles from "../../../ui/dashboard/status/status.module.css";
import Image from "next/image";
import Pagination from "../../../ui/dashboard/pagination/pagination";

const Status = () => {
  const [drivers, setDrivers] = useState([]);
  const [busStops, setBusStops] = useState([]);
  const [error, setError] = useState("");
  const [searchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 8;

  const companyID =
    typeof window !== "undefined" ? localStorage.getItem("companyID") : null;

  useEffect(() => {
    if (!companyID) {
      setError("Company ID not found. Please login again.");
      return;
    }

    const fetchBusStops = async () => {
      try {
        const busStopsCollection = collection(db, "Bus Stops");
        const busStopsSnapshot = await getDocs(busStopsCollection);
        const stopsList = busStopsSnapshot.docs
          .map((doc) => ({
            id: doc.id,
            name: doc.data().name,
          }))
          .sort((a, b) => a.name.localeCompare(b.name));
        setBusStops(stopsList);
      } catch (err) {
        setError("Error fetching bus stops");
        console.error("Error fetching bus stops:", err);
      }
    };

    const fetchDrivers = async () => {
      try {
        setLoading(true);
        const driverCollection = collection(db, "Drivers");
        const driverQuery = query(
          driverCollection,
          where("companyID", "==", companyID)
        );
        const driverSnapshot = await getDocs(driverQuery);
        const driverList = [];
        const storage = getStorage();

        for (const docSnapshot of driverSnapshot.docs) {
          const driverData = docSnapshot.data();
          const driverID = driverData.driverID || docSnapshot.id;

          if (driverData) {
            const driverName = `${capitalizeName(driverData.LName)}, ${capitalizeName(
              driverData.FName
            )} ${
              driverData.MName
                ? capitalizeName(driverData.MName.charAt(0)) + "."
                : ""
            }`;

            let avatar = "/noavatar.png";
            if (driverData.imageUrl) {
              try {
                const avatarRef = ref(storage, driverData.imageUrl);
                avatar = await getDownloadURL(avatarRef);
              } catch {
                console.error("Error fetching avatar for driver:", driverID);
              }
            }

            driverList.push({
              id: driverID,
              name: driverName,
              avatar,
              status: driverData.status || false,
              Status: driverData.status ? "Active" : "Inactive",
              driverID,
              FName: driverData.FName || "",
              LName: driverData.LName || "",
              MName: driverData.MName || "",
              companyID: driverData.companyID || "",
            });
          }
        }

        const sortedDrivers = driverList.sort((a, b) =>
        a.driverID.localeCompare(b.driverID)
        );


        setDrivers(sortedDrivers);
      } catch (err) {
        setError("Error fetching drivers");
        console.error("Error fetching drivers:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBusStops();
    fetchDrivers();
  }, [companyID]);

  const capitalizeName = (name) =>
    name ? name.charAt(0).toUpperCase() + name.slice(1).toLowerCase() : "";

  const term = searchTerm.toLowerCase();

  const filteredDrivers = drivers.filter((driver) => {
    const matchesName = driver.name.toLowerCase().includes(term);
    const matchesStatus =
      statusFilter === "All" || driver.Status === statusFilter;
    return matchesName && matchesStatus;
  });

  const totalPages = Math.ceil(filteredDrivers.length / itemsPerPage);

  const paginatedDrivers = filteredDrivers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className={styles.container}>
      <div className={styles.top}>
        <h2 className={styles.title}>Drivers Status</h2>
        <div className={styles.filters}>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className={styles.select}
          >
            <option value="All">All</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {error && <p style={{ color: "red", marginBottom: "1rem" }}>{error}</p>}

      <div className={styles["table-wrapper"]}>
        <table className={styles.table}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Driver ID</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan="3" className={styles.noData}>
                Loading drivers...
              </td>
            </tr>
          ) : paginatedDrivers.length > 0 ? (
            paginatedDrivers.map((driver) => (
              <tr key={driver.id}>
                <td>
                  <div className={styles.user}>
                    <Image
                      src={driver.avatar || "/noavatar.png"}
                      alt="Driver Avatar"
                      width={40}
                      height={40}
                      className={styles.userImage}
                    />
                    {driver.name}
                  </div>
                </td>
                <td>{driver.driverID}</td>
                <td>
                  <span
                    className={
                      driver.Status.toLowerCase() === "active"
                        ? styles.activeStatus
                        : styles.inactiveStatus
                    }
                  >
                    {driver.Status}
                  </span>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3" className={styles.noData}>
                No drivers found or saved.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default Status;
