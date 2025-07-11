"use client"

import { useEffect, useState } from 'react';
import { MdSupervisedUserCircle } from 'react-icons/md';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from "../../../lib/firebaseConfig";
import styles from './card.module.css';

const Card1 = () => {
    const [driverCount, setDriverCount] = useState(0);

    useEffect(() => {
        const fetchDriverCount = async () => {
            try {
                const companyID = localStorage.getItem("companyID");
                if (!companyID) {
                    console.warn("No companyID found in localStorage.");
                    return;
                }

                const driversRef = collection(db, 'Drivers');
                const q = query(driversRef, where("companyID", "==", companyID));
                const querySnapshot = await getDocs(q);

                setDriverCount(querySnapshot.size);
            } catch (error) {
                console.error("Error fetching driver count:", error);
            }
        };

        fetchDriverCount();
    }, []);

    return (
        <div className={styles.card}>
            <div className={styles.texts}>
                <span className={styles.number}>{driverCount}</span>
                <span className={styles.title}>Total Drivers</span>
            </div>
            <div className={styles.icon}>
                <MdSupervisedUserCircle size={28} />
            </div>
        </div>
    );
};

export default Card1;
