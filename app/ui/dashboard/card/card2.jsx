"use client";
/* global Set */
import { useEffect, useState } from "react";
import { FaBusAlt } from "react-icons/fa";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../../lib/firebaseConfig";
import styles from "./card.module.css";

const Card = () => {
    const [busCount, setBusCount] = useState(0);

    useEffect(() => {
        const storedCompanyID = localStorage.getItem("companyID");

        if (!storedCompanyID) return;

        const q = query(
            collection(db, "Route"),
            where("companyID", "==", storedCompanyID)
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const plateNumbers = new Set();

                snapshot.forEach((doc) => {
                    const plateNumber = doc.data().plateNumber;
                    if (plateNumber && plateNumber !== "N/A") {
                        plateNumbers.add(plateNumber);
                    }
                });

                setBusCount(plateNumbers.size || 0);
            },
            (error) => {
                console.error("Error fetching bus count:", error);
                setBusCount(0);
            }
        );

        return () => unsubscribe();
    }, []); 

    return (
        <div className={styles.card}>
            <div className={styles.texts}>
                <span className={styles.number}>{busCount}</span>
                <span className={styles.title}>Total MPUJs</span>
            </div>
            <div className={styles.icon}>
                <FaBusAlt size={28} />
            </div>
        </div>
    );
};

export default Card;
