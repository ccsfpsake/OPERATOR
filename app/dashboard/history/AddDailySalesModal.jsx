"use client";

import { useEffect, useState, useCallback } from "react";
import debounce from "lodash.debounce";
import { db } from "../../lib/firebaseConfig";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
} from "firebase/firestore";
import styles from "./AddDailySalesModal.module.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQuestionCircle } from "@fortawesome/free-solid-svg-icons";

const ticketTypes = ["PWD", "Senior", "Adult", "Student"];

const AddDailySalesModal = ({ onClose }) => {
  const [driverID, setDriverID] = useState("");
  const [drivers, setDrivers] = useState([]);
  const [firstDate, setFirstDate] = useState(() =>
    new Date().toISOString().split("T")[0]
  );
  const [lastDate, setLastDate] = useState(() =>
    new Date().toISOString().split("T")[0]
  );
  const [ticketDetails, setTicketDetails] = useState({});
  const [discounts, setDiscounts] = useState({});
  const [tripSales, setTripSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [tripCount, setTripCount] = useState(0);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [plateNumber, setPlateNumber] = useState("");
  const [routeName, setRouteName] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const resetForm = () => {
    setDriverID("");
    setFirstDate(new Date().toISOString().split("T")[0]);
    setLastDate(new Date().toISOString().split("T")[0]);
    setTicketDetails({});
    setTripSales([]);
    setExpenses([]);
    setTripCount(0);
    setPlateNumber("");
    setRouteName("");
  };

  useEffect(() => {
    document.querySelector("select")?.focus();

    const fetchDrivers = async () => {
      const companyID = localStorage.getItem("companyID");
      const snapshot = await getDocs(collection(db, "Drivers"));
      const filtered = snapshot.docs
        .map((doc) => ({ driverID: doc.id, ...doc.data() }))
        .filter((d) => d.companyID === companyID);
      setDrivers(filtered);
    };

    const fetchDiscounts = async () => {
      const snap = await getDoc(doc(db, "Farematrix", "aircon_puj"));
      if (snap.exists()) {
        const data = snap.data();
        setDiscounts({
          PWD: data.discount,
          Senior: data.discount,
          Adult: data,
          Student: data.discount,
        });
      }
    };

    fetchDrivers();
    fetchDiscounts();
  }, []);

  const fetchTripSales = useCallback(
    debounce(async (driverID, firstDate, lastDate) => {
      if (!driverID || !firstDate || !lastDate) {
        setTripSales([]);
        setTripCount(0);
        return;
      }

      try {
        setLoadingTrips(true);
        const historyRef = collection(db, "DriverHistory", driverID, "Trips");
        const snap = await getDocs(historyRef);

        const filtered = snap.docs
          .map((doc) => doc.data())
          .filter((d) => {
            if (!d.createdAt || !d.origin || !d.destination) return false;
            const createdAt = d.createdAt.toDate
              ? d.createdAt.toDate()
              : new Date(d.createdAt);
            const dateStr = createdAt.toISOString().split("T")[0];
            return dateStr >= firstDate && dateStr <= lastDate;
          });

        const grouped = {};
        filtered.forEach((d) => {
          const route = `${d.origin} - ${d.destination}`;
          grouped[route] = (grouped[route] || 0) + 1;
        });

        const result = Object.entries(grouped).map(([route, count]) => ({
          route,
          count,
          amount: "",
        }));

        setTripSales(result);
        setTripCount(filtered.length);
      } catch (error) {
        console.error("Failed to fetch trip sales:", error);
      } finally {
        setLoadingTrips(false);
      }
    }, 500),
    []
  );

  useEffect(() => {
    fetchTripSales(driverID, firstDate, lastDate);
  }, [driverID, firstDate, lastDate, fetchTripSales]);

  const handleDriverChange = async (id) => {
    setDriverID(id);
    try {
      const routeSnap = await getDocs(collection(db, "Route"));
      const route = routeSnap.docs
        .map((doc) => doc.data())
        .find((r) => r.driverID === id);

      setPlateNumber(route?.plateNumber || "");
      setRouteName(route?.route || "");
    } catch (err) {
      console.error("Failed to fetch plate/route:", err);
      setPlateNumber("");
      setRouteName("");
    }
  };

  const parseNumber = (value) => parseFloat(value.replace(/,/g, "")) || 0;

  const handleTicketChange = (type, field, value) => {
    setTicketDetails((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value,
      },
    }));
  };

  const handleExpenseChange = (index, field, value) => {
    const updated = [...expenses];
    updated[index][field] = value;
    setExpenses(updated);
  };

  const addExpenseRow = () => {
    setExpenses([...expenses, { name: "", cost: "" }]);
  };

  const getTotalTicketAmount = () =>
    tripSales.reduce((sum, r) => sum + parseNumber(r.amount), 0);

  const getTotalExpenses = () =>
    expenses.reduce((sum, exp) => sum + parseNumber(exp.cost), 0);

  const getNetSales = () => getTotalTicketAmount() - getTotalExpenses();

  const getTotalTicketCount = () => {
    return ticketTypes.reduce((sum, type) => {
      return sum + (parseInt(ticketDetails[type]?.count) || 0);
    }, 0);
  };

  const getTotalTicketAmountDetails = () => {
    return ticketTypes.reduce((sum, type) => {
      return sum + parseNumber(ticketDetails[type]?.amount || "0");
    }, 0);
  };

  const isFormValid = () => {
    if (!driverID || !firstDate || !lastDate) return false;

    for (const type of ticketTypes) {
      const details = ticketDetails[type];
      if (!details || !details.count || !details.amount) return false;
      if (isNaN(parseNumber(details.count)) || isNaN(parseNumber(details.amount)))
        return false;
    }

    for (const { amount } of tripSales) {
      if (amount === "" || isNaN(parseNumber(amount))) return false;
    }

    return true;
  };

  const handleSave = async () => {
    try {
      const dailySalesRef = collection(db, "dailysales", driverID, "dailysales");

      const docData = {
        driverID,
        plateNumber,
        route: routeName,
        firstDate,
        lastDate,
        createdAt: new Date(),
        ticketDetails,
        tripSales: tripSales.map(({ route, count, amount }) => ({
          route,
          count,
          amount: parseNumber(amount),
        })),
        expenses:
          expenses.filter((e) => e.name.trim() && parseNumber(e.cost)).length > 0
            ? expenses
                .filter((e) => e.name.trim() && parseNumber(e.cost))
                .map((e) => ({
                  name: e.name.trim(),
                  cost: parseNumber(e.cost),
                }))
            : [{ name: "None", cost: 0 }],
        totals: {
          totalTicketAmount: getTotalTicketAmount(),
          totalExpenses: getTotalExpenses(),
          tripCount,
          netSales: getNetSales(),
          totalTicketCount: getTotalTicketCount(),
          totalTicketAmountDetails: getTotalTicketAmountDetails(),
        },
      };

      await addDoc(dailySalesRef, docData);

      toast.success("Daily Sales saved successfully!", {
        autoClose: 2000,
        theme: "colored",
      });

      setShowConfirmModal(false);
      resetForm();
      setTimeout(onClose, 2000);
    } catch (error) {
      console.error("Error saving daily sales:", error);
      toast.error("Failed to save. Check console.", {
        autoClose: 2000,
        theme: "colored",
      });
    }
  };

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modal}>
        <h2 className={styles.h2}><strong>Daily Sales Form</strong></h2>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (isFormValid()) {
              setShowConfirmModal(true);
            }
          }}
        >
          {/* Driver Info */}
          <div className={styles.driverDateRow}>
            <div className={styles.formGroup}>
              <label><strong>Driver ID</strong></label>
              <select value={driverID} onChange={(e) => handleDriverChange(e.target.value)} required>
                <option value="">Select Driver</option>
                {drivers.map((d) => (
                  <option key={d.driverID} value={d.driverID}>
                    {d.driverID} - {d.LName}, {d.FName}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label><strong>First Trip Date</strong></label>
              <input type="date" value={firstDate} onChange={(e) => setFirstDate(e.target.value)} required />
            </div>

            <div className={styles.formGroup}>
              <label><strong>Last Trip Date</strong></label>
              <input type="date" value={lastDate} onChange={(e) => setLastDate(e.target.value)} required />
            </div>
          </div>

          {plateNumber && routeName && (
            <div style={{ margin: "10px 0" }}>
              <p><strong>Plate Number:</strong> {plateNumber}</p>
              <p><strong>Route:</strong> {routeName}</p>
            </div>
          )}

          {/* Ticket Details */}
          <h3 className={styles.h3}><strong>Ticket Details</strong></h3>
          <div className={styles.divider}></div>

          {ticketTypes.map((type) => (
            <div key={type} className={styles.ticketRow}>
              <span><strong>{type}</strong></span>
              <span><strong>{type === "Adult" ? "0%" : `${Math.round((discounts[type] || 0) * 100)}%`}</strong></span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="Count"
                value={ticketDetails[type]?.count || ""}
                onChange={(e) => handleTicketChange(type, "count", e.target.value)}
                required
              />
              <input
                type="text"
                inputMode="decimal"
                placeholder="Amount"
                value={ticketDetails[type]?.amount || ""}
                onChange={(e) => handleTicketChange(type, "amount", e.target.value)}
                required
              />
            </div>
          ))}

          <div className={styles.ticketRow}>
            <span><strong>TOTAL</strong></span>
            <span></span>
            <span style={{ fontWeight: "bold" }}>{getTotalTicketCount()}</span>
            <span style={{ fontWeight: "bold" }}>
              ₱{getTotalTicketAmountDetails().toLocaleString("en-PH", { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Trip Sales */}
          <h3 className={styles.h3}><strong>Trip Sales</strong> (Total Trips: {tripCount})</h3>
          <div className={styles.divider}></div>

          {loadingTrips ? (
            <p style={{ color: "gray" }}>Loading trips...</p>
          ) : tripSales.length === 0 ? (
            <p style={{ color: "gray" }}>No trips found for selected dates.</p>
          ) : (
            tripSales.map((r, i) => (
              <div key={i} className={styles.tripSales}>
                <span className={styles.routeSpan}><strong>{r.route}</strong></span>
                <span>{r.count} trips</span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Amount"
                  value={r.amount}
                  onChange={(e) => {
                    const updated = [...tripSales];
                    updated[i].amount = e.target.value;
                    setTripSales(updated);
                  }}
                  required
                />
              </div>
            ))
          )}

          {/* Expenses */}
          <h3 className={styles.h3}><strong>Expenses</strong></h3>
          <div className={styles.divider}></div>

          {expenses.map((exp, i) => (
            <div key={i} className={styles.ticketRow}>
              <input
                placeholder="Name"
                value={exp.name}
                onChange={(e) => handleExpenseChange(i, "name", e.target.value)}
              />
              <input
                type="text"
                inputMode="decimal"
                placeholder="Amount"
                value={exp.cost}
                onChange={(e) => handleExpenseChange(i, "cost", e.target.value)}
              />
            </div>
          ))}

          <button className={styles.addExpenseBtn} type="button" onClick={addExpenseRow}>+ Add Expense</button>

          {/* Summary */}
          <div className={styles.summary}>
            <p><strong>Total Sale:</strong> ₱{getTotalTicketAmount().toLocaleString("en-PH", { minimumFractionDigits: 2 })}</p>
            <p><strong>Total Expenses:</strong> ₱{getTotalExpenses().toLocaleString("en-PH", { minimumFractionDigits: 2 })}</p>
            <p><strong>Net Sale:</strong> ₱{getNetSales().toLocaleString("en-PH", { minimumFractionDigits: 2 })}</p>
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            <button className={styles.cancelButton} onClick={onClose}>Cancel</button>
            <button className={styles.saveBtn} type="submit">Save</button>
          </div>
        </form>

        {showConfirmModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.confirmModal}>
              <FontAwesomeIcon icon={faQuestionCircle} size="2x" style={{ marginBottom: "10px", color: "#4a90e2" }} />
              <p>Are you sure you want to add this daily sales record?</p>
              <div className={styles.buttons}>
                <button className={styles.cancelButton} onClick={() => setShowConfirmModal(false)}>Cancel</button>
                <button className={styles.saveBtn} onClick={handleSave}>Yes</button>
              </div>
            </div>
          </div>
        )}

        <ToastContainer position="top-right" autoClose={2000} theme="colored" />
      </div>
    </div>
  );
};

export default AddDailySalesModal;
