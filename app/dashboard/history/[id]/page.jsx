"use client";

import { useEffect, useState } from "react";
import React from "react";
import { useParams } from "next/navigation";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../../lib/firebaseConfig";
import styles from "../../../../app/ui/dashboard/history/viewhistory.module.css";
import Search from "../../../../app/ui/dashboard/search/search";
import EditDailySalesModal from "../EditDailySalesModal";

const DriverSalesPage = () => {
  const { id: driverID } = useParams();
  const [allSales, setAllSales] = useState([]);
  const [selectedSales, setSelectedSales] = useState(null);
  const [routeInfo, setRouteInfo] = useState({ plateNumber: "", route: "" });
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRows, setExpandedRows] = useState({});
  const [editingSaleId, setEditingSaleId] = useState(null);

  useEffect(() => {
    if (!driverID) return;

    const fetchAllSales = async () => {
      try {
        setLoading(true);

        const salesRef = collection(db, `dailysales/${driverID}/dailysales`);
        const q = query(salesRef, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const sales = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          data: doc.data(),
        }));
        setAllSales(sales);
        if (sales.length > 0) {
          setSelectedSales(sales[0]);
        }

        const routeRef = collection(db, "Route");
        const routeQuery = query(routeRef, where("driverID", "==", driverID));
        const routeSnap = await getDocs(routeQuery);
        if (!routeSnap.empty) {
          const { plateNumber = "", route = "" } = routeSnap.docs[0].data();
          setRouteInfo({ plateNumber, route });
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllSales();
  }, [driverID]);

  const addNewSalesDocument = async () => {
    try {
      const routeRef = collection(db, "Route");
      const routeQuery = query(routeRef, where("driverID", "==", driverID));
      const routeSnap = await getDocs(routeQuery);

      let plateNumber = "";
      let route = "";

      if (!routeSnap.empty) {
        const data = routeSnap.docs[0].data();
        plateNumber = data.plateNumber || "";
        route = data.route || "";
      }

      const salesRef = collection(db, `dailysales/${driverID}/dailysales`);
      await addDoc(salesRef, {
        plateNumber,
        route,
        firstDate: "",
        lastDate: "",
        tripSales: [],
        ticketDetails: {},
        expenses: [],
        totals: {
          tripCount: 0,
          totalTicketCount: 0,
          totalTicketAmount: 0,
          totalExpenses: 0,
          netSales: 0,
        },
        createdAt: Timestamp.now(),
      });
    } catch (err) {
      console.error("Error adding sales:", err);
    }
  };

  const toggleExpand = (id) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const isDateInRange = (sale) => {
    if (!startDate || !endDate) return true;
    const { firstDate, lastDate } = sale.data;
    if (!firstDate || !lastDate) return false;

    const first = new Date(firstDate);
    const last = new Date(lastDate);
    const start = new Date(startDate);
    const end = new Date(endDate);

    return !(last < start || first > end);
  };

  const filteredSales = allSales.filter((sale) => {
    const data = sale.data;
    const searchLower = searchTerm.toLowerCase();

    const matchesSearch =
      data.firstDate?.toLowerCase().includes(searchLower) ||
      data.lastDate?.toLowerCase().includes(searchLower) ||
      (routeInfo.route || "").toLowerCase().includes(searchLower) ||
      (routeInfo.plateNumber || "").toLowerCase().includes(searchLower) ||
      data.totals?.tripCount?.toString().includes(searchLower) ||
      data.totals?.totalTicketCount?.toString().includes(searchLower) ||
      data.totals?.totalTicketAmount?.toString().includes(searchLower) ||
      data.totals?.netSales?.toString().includes(searchLower);

    return matchesSearch && isDateInRange(sale);
  });

  return (
    <div className={styles.container}>
      <div className={styles.top}>
        <div className={styles.dateRangeWrapper}>
          <input
            className={styles.select}
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <span style={{ margin: "0 8px" }}>-</span>
          <input
            className={styles.select}
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <Search
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Date Range</th>
            <th>Plate Number</th>
            <th>Route</th>
            <th>Trip Count</th>
            <th>Total Ticket</th>
            <th>Total Fare</th>
            <th>Total Expenses</th>
            <th>Net Sales</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={9} style={{ textAlign: "center" }}>
                Loading sales data...
              </td>
            </tr>
          ) : filteredSales.length === 0 ? (
            <tr>
              <td colSpan={9} style={{ textAlign: "center" }}>
                No data found.
              </td>
            </tr>
          ) : (
            filteredSales.map((sale) => {
              const {
                firstDate,
                lastDate,
                tripSales = [],
                ticketDetails = {},
                expenses = [],
                totals = {},
              } = sale.data;

              const isExpanded = expandedRows[sale.id];

              return (
                <React.Fragment key={sale.id}>
                  <tr
                    className={isExpanded ? styles.expandedRow : ""}
                    style={{ cursor: "pointer" }}
                    onClick={() => toggleExpand(sale.id)}
                  >
                    <td>
                      <span className={styles.arrow}>
                        {isExpanded ? "▼" : "►"}
                      </span>{" "}
                      {formatDate(firstDate)} - {formatDate(lastDate)}
                    </td>
                    <td>{sale.data.plateNumber || "N/A"}</td>
                    <td>{sale.data.route || "N/A"}</td>
                    <td>{totals.tripCount ?? "N/A"}</td>
                    <td>{totals.totalTicketCount ?? 0}</td>
                    <td>₱{totals.totalTicketAmount?.toLocaleString() ?? "0"}</td>
                    <td>₱{totals.totalExpenses?.toLocaleString() ?? "0"}</td>
                    <td>₱{totals.netSales?.toLocaleString() ?? "0"}</td>
                    <td>
                      <button
                        className={styles.editBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingSaleId(sale.id);
                        }}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>

                  {isExpanded && (
                    <>
                      <tr className={styles.subRow}>
                        <td colSpan={9}>
                          <strong>Trip Sales</strong>
                          <ul>
                            {tripSales.map((r, i) => (
                              <li key={i}>
                                {r.route} — ₱{r.amount} ({r.count} trips)
                              </li>
                            ))}
                          </ul>
                        </td>
                      </tr>

                      <tr className={styles.subRow}>
                        <td colSpan={9}>
                          <strong>Ticket Details</strong>
                          <ul>
                            {Object.entries(ticketDetails).map(
                              ([type, detail]) => (
                                <li key={type}>
                                  {type}: ₱{detail.amount} ({detail.count} tickets)
                                </li>
                              )
                            )}
                          </ul>
                        </td>
                      </tr>

                      <tr className={styles.subRow}>
                        <td colSpan={9}>
                          <strong>Expenses</strong>
                          <ul>
                            {expenses.map((e, i) => (
                              <li key={i}>
                                {e.name}: ₱{e.cost}
                              </li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    </>
                  )}
                </React.Fragment>
              );
            })
          )}
        </tbody>
      </table>

      {editingSaleId && (
        <EditDailySalesModal
          saleId={editingSaleId}
          saleData={allSales.find((s) => s.id === editingSaleId)?.data}
          driverID={driverID}
          onClose={() => setEditingSaleId(null)}
        />
      )}
    </div>
  );
};

export default DriverSalesPage;
