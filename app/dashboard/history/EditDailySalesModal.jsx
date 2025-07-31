"use client";

import { useEffect, useState } from "react";
import { db } from "../../lib/firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";
import styles from "./AddDailySalesModal.module.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ticketTypes = ["PWD", "Senior", "Adult", "Student"];
const defaultDiscounts = {
  PWD: 0.2,
  Senior: 0.2,
  Student: 0.2,
  Adult: 0,
};

const EditDailySalesModal = ({ onClose, saleData, saleId, driverID }) => {
  const [firstDate, setFirstDate] = useState("");
  const [lastDate, setLastDate] = useState("");
  const [ticketDetails, setTicketDetails] = useState({});
  const [tripSales, setTripSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [plateNumber, setPlateNumber] = useState("");
  const [routeName, setRouteName] = useState("");

  const parseNumber = (value) =>
    parseFloat(value?.toString().replace(/,/g, "")) || 0;

  useEffect(() => {
    if (saleData) {
      setFirstDate(saleData.firstDate || "");
      setLastDate(saleData.lastDate || "");
      setTicketDetails(saleData.ticketDetails || {});
      setTripSales(saleData.tripSales || []);
      setExpenses(saleData.expenses || []);
      setPlateNumber(saleData.plateNumber || "");
      setRouteName(saleData.route || "");
    }
  }, [saleData]);

  const handleTicketChange = (type, field, value) => {
    setTicketDetails((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value,
      },
    }));
  };

  const handleTripChange = (index, field, value) => {
    const updated = [...tripSales];
    updated[index][field] = value;
    setTripSales(updated);
  };

  const handleExpenseChange = (index, field, value) => {
    const updated = [...expenses];
    updated[index][field] = value;
    setExpenses(updated);
  };

  const addExpenseRow = () => {
    setExpenses([...expenses, { name: "", cost: "" }]);
  };

  const getTotalTicketAmount = () => {
    return tripSales.reduce((sum, r) => sum + parseNumber(r.amount), 0);
  };

  const getTotalExpenses = () => {
    return expenses.reduce((sum, exp) => sum + parseNumber(exp.cost), 0);
  };

  const getNetSales = () => getTotalTicketAmount() - getTotalExpenses();

  const getTotalTicketCount = () => {
    return ticketTypes.reduce((sum, type) => {
      return sum + (parseInt(ticketDetails[type]?.count) || 0);
    }, 0);
  };

  const getTotalTicketAmountDetails = () => {
    return ticketTypes.reduce((sum, type) => {
      return sum + parseNumber(ticketDetails[type]?.amount);
    }, 0);
  };

  const getTripCount = () => {
    return tripSales.reduce((sum, r) => sum + (parseInt(r.count) || 0), 0);
  };

  const isFormValid = () => {
    if (!firstDate || !lastDate) return false;

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

  const handleUpdate = async () => {
    if (!isFormValid()) {
      toast.error("Please fill all fields correctly.", {
        autoClose: 2000,
        theme: "colored",
      });
      return;
    }

    const hasChanges =
      firstDate !== saleData.firstDate ||
      lastDate !== saleData.lastDate ||
      JSON.stringify(ticketDetails) !== JSON.stringify(saleData.ticketDetails) ||
      JSON.stringify(tripSales) !== JSON.stringify(saleData.tripSales) ||
      JSON.stringify(expenses) !== JSON.stringify(saleData.expenses);

    if (!hasChanges) {
      toast.info("No changes detected.", {
        autoClose: 2000,
        theme: "colored",
      });
      return;
    }

    try {
      const salesDocRef = doc(db, "dailysales", driverID, "dailysales", saleId);

      await updateDoc(salesDocRef, {
        firstDate,
        lastDate,
        ticketDetails,
        tripSales: tripSales.map(({ route, count, amount }) => ({
          route,
          count,
          amount: parseNumber(amount),
        })),
        expenses: expenses
          .filter((e) => e.name.trim() && parseNumber(e.cost))
          .map((e) => ({
            name: e.name.trim(),
            cost: parseNumber(e.cost),
          })),
        totals: {
          totalTicketAmount: getTotalTicketAmount(),
          totalExpenses: getTotalExpenses(),
          tripCount: getTripCount(),
          netSales: getNetSales(),
          totalTicketCount: getTotalTicketCount(),
          totalTicketAmountDetails: getTotalTicketAmountDetails(),
        },
      });

      toast.success("Sales updated successfully!", {
        autoClose: 2000,
        theme: "colored",
      });

      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Error updating sales:", error);
      toast.error("Failed to update sales. Please try again.", {
        autoClose: 2000,
        theme: "colored",
      });
    }
  };

  return (
    <>
      <div className={styles.modalBackdrop}>
        <div className={styles.modal}>
          <h2 className={styles.h2}><strong>Edit Daily Sales</strong></h2>

          <div className={styles.driverDateRow}>
            <div className={styles.formGroup}>
              <label><strong>Driver ID</strong></label>
              <input type="text" value={driverID} readOnly className={styles.readonlyInput} />
            </div>

            <div className={styles.formGroup}>
              <label><strong>First Trip Date</strong></label>
              <input
                type="date"
                value={firstDate}
                onChange={(e) => setFirstDate(e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label><strong>Last Trip Date</strong></label>
              <input
                type="date"
                value={lastDate}
                onChange={(e) => setLastDate(e.target.value)}
              />
            </div>
          </div>

          {plateNumber && routeName && (
            <div style={{ margin: "10px 0" }}>
              <p><strong>Plate Number:</strong> {plateNumber}</p>
              <p><strong>Route:</strong> {routeName}</p>
            </div>
          )}

          <h3 className={styles.h3}><strong>Ticket Details</strong></h3>
          <div className={styles.divider}></div>

          {ticketTypes.map((type) => (
            <div key={type} className={styles.ticketRow}>
              <span><strong>{type}</strong></span>
              <span><strong>{type === "Adult" ? "0%" : `${Math.round(defaultDiscounts[type] * 100)}%`}</strong></span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="Count"
                value={ticketDetails[type]?.count || ""}
                onChange={(e) => handleTicketChange(type, "count", e.target.value)}
              />
              <input
                type="text"
                inputMode="decimal"
                placeholder="Amount"
                value={ticketDetails[type]?.amount || ""}
                onChange={(e) => handleTicketChange(type, "amount", e.target.value)}
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

          <h3 className={styles.h3}><strong>Trip Sales</strong></h3>
          <div className={styles.divider}></div>

          {tripSales.map((r, i) => (
            <div key={i} className={styles.tripSales}>
              <span className={styles.routeSpan}><strong>{r.route}</strong></span>
              <span>{r.count} trips</span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="Amount"
                value={r.amount}
                onChange={(e) => handleTripChange(i, "amount", e.target.value)}
              />
            </div>
          ))}

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

          <button className={styles.addExpenseBtn} onClick={addExpenseRow}>
            + Add Expense
          </button>

          <div className={styles.summary}>
            <p><strong>Total Sale:</strong> ₱{getTotalTicketAmount().toLocaleString("en-PH", { minimumFractionDigits: 2 })}</p>
            <p><strong>Total Expenses:</strong> ₱{getTotalExpenses().toLocaleString("en-PH", { minimumFractionDigits: 2 })}</p>
            <p><strong>Net Sale:</strong> ₱{getNetSales().toLocaleString("en-PH", { minimumFractionDigits: 2 })}</p>
          </div>

          <div className={styles.actions}>
            <button className={styles.cancelButton} onClick={onClose}>Cancel</button>
            <button className={styles.saveBtn} onClick={handleUpdate}>Update</button>
          </div>
        </div>
      </div>

      <ToastContainer position="top-right" autoClose={2000} theme="colored" />
    </>
  );
};

export default EditDailySalesModal;
