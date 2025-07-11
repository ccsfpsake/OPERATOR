"use client";

import { useEffect, useState } from "react";
import { db } from "../../../app/lib/firebaseConfig";
import {
  collection,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import styles from "../../../app/ui/dashboard/route/route.module.css";
import Image from "next/image";
import Link from "next/link";
import Search from "../../../app/ui/dashboard/search/search";
import Pagination from "../../../app/ui/dashboard/pagination/pagination";

const RoutePage = () => {
  const [drivers, setDrivers] = useState([]);
  const [busStops, setBusStops] = useState([]);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 10;

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

            const busQuery = query(
              collection(db, "Route"),
              where("driverID", "==", driverID)
            );
            const busSnapshot = await getDocs(busQuery);

            let routeText = "Not assigned";
            let plateNumber = "Pending";

            if (!busSnapshot.empty) {
              const busData = busSnapshot.docs[0].data();
              plateNumber = busData.plateNumber || "Pending";
              routeText = busData.route || "Not assigned";
            }

            const status = driverData.status || false;

            driverList.push({
              id: driverID,
              name: driverName,
              avatar,
              route: routeText,
              plateNumber,
              status,
              driverID,
              FName: driverData.FName || "",
              LName: driverData.LName || "",
              MName: driverData.MName || "",
              Status: status ? "Active" : "Inactive",
              companyID: driverData.companyID || "",
            });
          }
        }

        const sortedDrivers = driverList.sort((a, b) =>
          a.driverID.toLowerCase().localeCompare(b.driverID.toLowerCase())
        );

        setDrivers(sortedDrivers);
      } catch (err) {
        setError("Error fetching drivers and routes");
        console.error("Error fetching drivers:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBusStops();
    fetchDrivers();
  }, [companyID]);

  const handleDeleteDriver = async (driverID) => {
    try {
      const busQuery = query(
        collection(db, "Route"),
        where("driverID", "==", driverID)
      );
      const busSnapshot = await getDocs(busQuery);

      if (!busSnapshot.empty) {
        const buses = busSnapshot.docs;
        if (buses.length === 1) {
          const busDoc = buses[0].ref;
          await deleteDoc(busDoc);
          console.log("Associated Bus document deleted successfully.");
        }
      }

      const driverDoc = doc(db, "Drivers", driverID);
      await deleteDoc(driverDoc);
      console.log("Driver document deleted successfully.");

      setDrivers((prevDrivers) =>
        prevDrivers.filter((driver) => driver.driverID !== driverID)
      );
    } catch (error) {
      console.error("Error deleting driver and associated bus:", error);
    }
  };

  const capitalizeName = (name) =>
    name ? name.charAt(0).toUpperCase() + name.slice(1).toLowerCase() : "";

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const term = searchTerm.toLowerCase();

  const filteredDrivers = drivers.filter((driver) => {
    const route = driver.route || "Not assigned";
    const matchesSearch =
      (driver.name && driver.name.toLowerCase().includes(term)) ||
      route.toLowerCase().includes(term) ||
      (driver.plateNumber &&
        driver.plateNumber.toLowerCase().includes(term)) ||
      (driver.Status && driver.Status.toLowerCase().includes(term)) ||
      (driver.driverID && driver.driverID.toLowerCase().includes(term));

    const matchesStatus =
      statusFilter === "All" || driver.Status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredDrivers.length / itemsPerPage);

  const paginatedDrivers = filteredDrivers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  return (
    <div className={styles.container}>
      <div className={styles.top}>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className={styles.select}
        >
          <option value="All">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
        <Search
          placeholder="Search for a driver..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
        />
      </div>

      {error && <p style={{ color: "red", marginBottom: "1rem" }}>{error}</p>}

      <div className={styles["table-wrapper"]}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Driver ID</th>
              <th>Plate #</th>
              <th>Route</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className={styles.noData}>
                  Loading routes...
                </td>
              </tr>
            ) : paginatedDrivers.length > 0 ? (
              paginatedDrivers.map((bus) => (
                <tr key={bus.id}>
                  <td>
                    <div className={styles.user}>
                      <Image
                        src={bus.avatar || "/noavatar.png"}
                        alt="Driver Avatar"
                        width={40}
                        height={40}
                        className={styles.userImage}
                      />
                      {bus.name}
                    </div>
                  </td>
                  <td>{bus.driverID}</td>
                  <td>{bus.plateNumber}</td>
                  <td>{bus.route || "Not assigned"}</td>
                  <td>
                    <span
                      className={
                        bus.Status.toLowerCase() === "active"
                          ? styles.activeStatus
                          : styles.inactiveStatus
                      }
                    >
                      {bus.Status}
                    </span>
                  </td>
                  <td>
                    <div className={styles.buttons}>
                      <Link href={`/dashboard/route/edit/${bus.id}`}>
                        <button className={`${styles.button} ${styles.edit}`}>
                          Edit
                        </button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className={styles.noData}>
                  No routes found or saved.
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

export default RoutePage;
