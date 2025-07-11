"use client";
import styles from "../../../../app/ui/dashboard/operator/dashoper.module.css";
import Pagination from "../../../../app/ui/dashboard/pagination/pagination";
import Search from "../../../../app/ui/dashboard/search/search";
import Image from "next/image";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../../app/lib/firebaseConfig";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { useEffect, useState } from "react";

const Dashoper = () => {
  const [operators, setOperators] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
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

  return (
    <div className={styles.container}>
      <div className={styles.top}>
      <h1 className={styles.semititle}>OPERATORS</h1>
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
              </tr>
            </thead>
            <tbody>
  {currentOperators.length === 0 ? (
    <tr>
      <td colSpan="4" className={styles.noData}>No operators available</td>
    </tr>
  ) : (
    currentOperators.map((operator) => (
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
            <span>
              {capitalizeName(operator.LName)}, {capitalizeName(operator.FName)}
              {operator.MName ? ` ${capitalizeName(operator.MName.charAt(0))}.` : ""}
            </span>
          </div>
        </td>
        <td>{operator.Email || "N/A"}</td>
        <td>{operator.Contact || "N/A"}</td>
        <td>{operator.Status}</td>
      </tr>
    ))
  )}
</tbody>

          </table>
        )}
      </div>

      <Pagination totalItems={filteredOperators.length} itemsPerPage={operatorsPerPage} paginate={paginate} currentPage={currentPage} />
    </div>
  );
};

export default Dashoper;
