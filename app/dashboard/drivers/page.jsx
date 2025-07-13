/* eslint-env es6, browser */

"use client";

import styles from "../../../app/ui/dashboard/drivers/drivers.module.css";
import Search from "../../../app/ui/dashboard/search/search";
import Image from "next/image";
import Link from "next/link";
import { deleteDoc, doc, collection, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebaseConfig";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { useEffect, useState } from "react";
import { FaTrash } from "react-icons/fa";
import Pagination from "../../../app/ui/dashboard/pagination/pagination";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


const DriversPage = () => {
  const [drivers, setDrivers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const companyID = localStorage.getItem("companyID");

    if (!companyID) {
      setDrivers([]);
      setLoading(false);
      return;
    }

    const driversRef = collection(db, "Drivers");

    const unsubscribe = onSnapshot(driversRef, (querySnapshot) => {
      const driversList = [];

      querySnapshot.forEach((doc) => {
        const driverData = doc.data();
        const driverId = doc.id;

        if (driverData.companyID !== companyID) return;

        driversList.push({ id: driverId, ...driverData });
      });

      const fetchImages = async () => {
        const storage = getStorage();
        const driversWithImages = await Promise.all(
          driversList.map(async (driver) => {
            if (driver.imageUrl) {
              try {
                const imageRef = ref(storage, driver.imageUrl);
                const url = await getDownloadURL(imageRef);
                return { ...driver, imageUrl: url };
              } catch (error) {
                console.error("Error fetching image URL:", error);
                return { ...driver, imageUrl: "/noavatar.png" };
              }
            }
            return { ...driver, imageUrl: "/noavatar.png" };
          })
        );
        setDrivers(driversWithImages);
        setLoading(false);
      };

      fetchImages();
    });

    return () => unsubscribe();
  }, []);

const handleDelete = async () => {
  try {
    if (selectedDriverId) {
      await deleteDoc(doc(db, "Drivers", selectedDriverId));
      setDrivers((prevDrivers) =>
        prevDrivers.filter((driver) => driver.id !== selectedDriverId)
      );
      setShowModal(false);
      setSelectedDriverId(null);
      toast.success("Driver deleted successfully."); 
    }
  } catch (error) {
    console.error("Error deleting driver:", error);
    toast.error("Failed to delete driver."); 
  }
};


  const confirmDelete = (id) => {
    setSelectedDriverId(id);
    setShowModal(true);
  };

  const capitalizeName = (name) => {
    if (!name) return "";
    return name
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const filteredDrivers = drivers
    .filter((driver) => {
      const term = searchTerm.toLowerCase();
      return (
        (driver.FName && driver.FName.toLowerCase().includes(term)) ||
        (driver.LName && driver.LName.toLowerCase().includes(term)) ||
        (driver.MName && driver.MName.toLowerCase().includes(term)) ||
        (driver.Email && driver.Email.toLowerCase().includes(term)) ||
        (driver.LicenseNo && driver.LicenseNo.toLowerCase().includes(term)) ||
        (driver.Contact && driver.Contact.includes(term)) ||
        (driver.driverID && driver.driverID.toLowerCase().includes(term)) ||
        (driver.houseno && driver.houseno.toLowerCase().includes(term)) ||
        (driver.City && driver.City.toLowerCase().includes(term)) ||
        (driver.Barangay && driver.Barangay.toLowerCase().includes(term)) ||
        (driver.Province && driver.Province.toLowerCase().includes(term)) ||
        (driver.companyID && driver.companyID.toLowerCase().includes(term))
      );
    })
    .sort((a, b) => a.driverID?.localeCompare(b.driverID))

  const totalPages = Math.ceil(filteredDrivers.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentDrivers = filteredDrivers.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className={styles.container}>
      {showModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalIcon}>
              <FaTrash />
            </div>
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete this account? This action cannot be undone.</p>
            <div className={styles.modalButtons}>
              <button className={`${styles.button} ${styles.cancel}`} onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className={`${styles.button} ${styles.delete}`} onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.top}>
        <Link href="/dashboard/drivers/add">
          <button className={styles.addButton}>Add New</button>
        </Link>
        <Search
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
        />
      </div>

      <div className={styles["table-wrapper"]}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>ID No.</th>
              <th>License No.</th>
              <th>Email</th>
              <th>Contact</th>
              <th>Address</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className={styles.noData}>
                  Loading drivers...
                </td>
              </tr>
            ) : currentDrivers.length > 0 ? (
              currentDrivers.map((driver) => (
                <tr key={driver.id}>
                  <td>
                    <div className={styles.user}>
                      <Image
                        src={driver.imageUrl || "/noavatar.png"}
                        alt={`${driver.FName} ${driver.LName}'s Avatar`}
                        width={40}
                        height={40}
                        className={styles.userImage}
                      />
                      <span>
                        {capitalizeName(driver.LName)}, {capitalizeName(driver.FName)}{" "}
                        {driver.MName && `${capitalizeName(driver.MName.charAt(0))}.`}
                      </span>
                    </div>
                  </td>
                  <td>{driver.driverID || "N/A"}</td>
                  <td>{driver.LicenseNo || "N/A"}</td>
                  <td>{driver.Email || "N/A"}</td>
                  <td>{driver.Contact || "N/A"}</td>
                  <td>
                    {
                      [driver.houseno, driver.Barangay, driver.City, driver.Province]
                        .filter(Boolean)
                        .map(capitalizeName)
                        .join(", ") || "Address not available"
                    }
                  </td>
                  <td>
                    <div className={styles.buttons}>
                      <Link href={`/dashboard/drivers/edit/${driver.id}`}>
                        <button className={`${styles.button} ${styles.edit}`}>Edit</button>
                      </Link>
                      <button
                        className={`${styles.button} ${styles.delete}`}
                        onClick={() => confirmDelete(driver.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className={styles.noData}>
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

<ToastContainer
  position="top-right"
  autoClose={2000}
  hideProgressBar={false}
  newestOnTop={false}
  closeOnClick
  rtl={false}
  pauseOnFocusLoss
  draggable
  pauseOnHover
  theme="colored"
/>

    </div>
    
  );
};

export default DriversPage;
