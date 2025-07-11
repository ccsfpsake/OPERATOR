"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebaseConfig";
import Search from "../../../app/ui/dashboard/search/search";
import Pagination from "../../../app/ui/dashboard/pagination/pagination";
import Image from "next/image";
import styles from "../../../app/ui/dashboard/history/history.module.css";

const HistoryPage = () => {
  const [drivers, setDrivers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const companyID = localStorage.getItem("companyID");
        const driversSnapshot = await getDocs(collection(db, "Drivers"));
        const driversList = driversSnapshot.docs
          .map((doc) => {
            const data = doc.data();
            return {
              driverID: doc.id,
              ...data,
            };
          })
          .filter((driver) => driver.companyID === companyID);

        setDrivers(driversList);
      } catch (error) {
        console.error("Error fetching drivers:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleViewClick = (driverID) => {
    router.push(`/dashboard/history/${driverID}`);
  };

  const capitalizeName = (name) =>
    name ? name.charAt(0).toUpperCase() + name.slice(1).toLowerCase() : "";

  const filteredDrivers = drivers
    .filter(
      (driver) =>
        driver.FName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.LName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.driverID?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.Contact?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const idA = a.driverID?.toLowerCase() || "";
      const idB = b.driverID?.toLowerCase() || "";
      return idA.localeCompare(idB);
    });    

  const totalPages = Math.ceil(filteredDrivers.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentDrivers = filteredDrivers.slice(indexOfFirstItem, indexOfLastItem);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

return (
  <div className={styles.container}>
    <div className={styles.top}>
      <Search
        className={styles.search}
        placeholder="Search.."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>

    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Driver ID</th>
            <th>Contact</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan="7" className={styles.noData}>
                Loading history...
              </td>
            </tr>
          ) : currentDrivers.length === 0 ? (
            <tr>
              <td colSpan="7" className={styles.noData}>
                No drivers found or saved.
              </td>
            </tr>
          ) : (
            currentDrivers.map((driver) => (
              <tr key={driver.driverID}>
                <td>
                  <div className={styles.user}>
                    <Image
                      src={driver.imageUrl || "/noavatar.png"}
                      alt="Driver Avatar"
                      width={40}
                      height={40}
                      className={styles.userImage}
                    />
                    {`${capitalizeName(driver.LName)}, ${capitalizeName(driver.FName)}`}
                  </div>
                </td>
                <td>{driver.driverID}</td>
                <td>{driver.Contact || "Not available"}</td>
                <td>
                  <div className={styles.buttons}>
                    <button
                      className={styles.view}
                      onClick={() => handleViewClick(driver.driverID)}
                    >
                      View
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>

    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      onPrevious={handlePreviousPage}
      onNext={handleNextPage}
    />
  </div>
);
};

export default HistoryPage;
