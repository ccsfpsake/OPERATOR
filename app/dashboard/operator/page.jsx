"use client";

import styles from "../../../app/ui/dashboard/operator/operator.module.css";
import Pagination from "../../../app/ui/dashboard/pagination/pagination";
import Search from "../../../app/ui/dashboard/search/search";
import Image from "next/image";
import { collection, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../../app/lib/firebaseConfig";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const OperatorPage = () => {
  const [operators, setOperators] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const operatorsPerPage = 10;

  useEffect(() => {
    const fetchOperators = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "Operator"));
        const operatorsList = [];

        for (const doc of querySnapshot.docs) {
          const operatorData = doc.data();
          const operatorId = doc.id;
          operatorData.Status = operatorData.Status || "Pending";

          if (operatorData.imageUrl) {
            const storage = getStorage();
            const imageRef = ref(storage, operatorData.imageUrl);
            try {
              const imageUrl = await getDownloadURL(imageRef);
              operatorData.imageUrl = imageUrl;
            } catch (error) {
              console.error("Error fetching image URL:", error);
              operatorData.imageUrl = "/noavatar.png";
            }
          } else {
            operatorData.imageUrl = "/noavatar.png";
          }

          operatorsList.push({ id: operatorId, ...operatorData });
        }

        setOperators(operatorsList);
      } catch (error) {
        console.error("Error fetching operators:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOperators();
  }, []);

  const capitalizeName = (name) => {
    if (!name) return "N/A";
    return name
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const filteredOperators = operators
    .filter((operator) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        (operator.FName && operator.FName.toLowerCase().includes(searchLower)) ||
        (operator.LName && operator.LName.toLowerCase().includes(searchLower)) ||
        (operator.Email && operator.Email.toLowerCase().includes(searchLower)) ||
        (operator.Contact && operator.Contact.includes(searchLower)) ||
        (operator.Status && operator.Status.toLowerCase().includes(searchLower))
      );
    })
    .sort((a, b) => (a.LName?.toLowerCase() || "").localeCompare(b.LName?.toLowerCase() || ""));

  const indexOfLastOperator = currentPage * operatorsPerPage;
  const indexOfFirstOperator = indexOfLastOperator - operatorsPerPage;
  const currentOperators = filteredOperators.slice(indexOfFirstOperator, indexOfLastOperator);

  const handleSearch = (e) => setSearchTerm(e.target.value);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const updateStatus = async (operatorId, newStatus) => {
    try {
      const operatorRef = doc(db, "Operator", operatorId);
      await updateDoc(operatorRef, { Status: newStatus });

      setOperators((prev) =>
        prev.map((op) => (op.id === operatorId ? { ...op, Status: newStatus } : op))
      );

      toast.success("Status updated successfully!", { theme: "colored" });
    } catch (error) {
      console.error("Error updating operator status:", error);
      toast.error("Error updating status. Please try again.", { theme: "colored" });
    }
  };

  const confirmDelete = (id) => {
    setDeleteId(id);
    setShowModal(true);
  };

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, "Operator", deleteId));
      setOperators(operators.filter((operator) => operator.id !== deleteId));
      toast.success("Operator deleted successfully!", { theme: "colored" });
    } catch (error) {
      console.error("Error deleting operator:", error);
      toast.error("Error deleting operator. Please try again.", { theme: "colored" });
    } finally {
      setShowModal(false);
    }
  };

  return (
    <div className={styles.container}>
      <ToastContainer />

      {showModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Are you sure you want to delete?</h3>
            <p>This action cannot be undone.</p>
            <div className={styles.modalButtons}>
              <button className={`${styles.button} ${styles.cancel}`} onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className={`${styles.button} ${styles.delete}`} onClick={handleDelete}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.top}>
        <Search placeholder="Search.." value={searchTerm} onChange={handleSearch} />
      </div>

      <div className={styles["table-wrapper"]}>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentOperators.map((operator) => (
                <tr key={operator.id}>
                  <td>
                  <div className={styles.user}>
                      <Image
                        src={operator.imageUrl || "/noavatar.png"}
                        alt={`${operator.FName} ${operator.LName}'s Avatar`}
                        width={40}
                        height={40}
                        className={styles.userImage}
                      />
                    <span>{capitalizeName(operator.LName)}, {capitalizeName(operator.FName)}</span>
                    </div>
                  </td>
                  <td>{operator.Email || "N/A"}</td>
                  <td>{operator.Contact || "N/A"}</td>
                  <td>
                    <select value={operator.Status} onChange={(e) => updateStatus(operator.id, e.target.value)}>
                      <option value="Pending">Pending</option>
                      <option value="Verified">Verified</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                  </td>
                  <td>
                    <button className={`${styles.button} ${styles.delete}`} onClick={() => confirmDelete(operator.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination totalItems={filteredOperators.length} itemsPerPage={operatorsPerPage} paginate={paginate} currentPage={currentPage} />
    </div>
  );
};

export default OperatorPage;
