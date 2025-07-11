"use client"

import { useEffect, useState } from 'react';
import { FaRoute } from "react-icons/fa";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../lib/firebaseConfig";
import styles from './card.module.css';

const Card = () => {
    const [lineCount, setLineCount] = useState(0);

    useEffect(() => {
        const fetchLineCount = async () => {
            try {
                
                const querySnapshot = await getDocs(collection(db, 'Lines'));
                setLineCount(querySnapshot.size); 
            } catch (error) {
                console.error("Error fetching line count:", error);
            }
        };

        fetchLineCount();
    }, []);

    return (
        <div className={styles.card}>
            <div className={styles.texts}>
                <span className={styles.number}>{lineCount}</span>
                <span className={styles.title}>Total Routes</span>
            </div>
            <div className={styles.icon}>
                <FaRoute size={28} />
            </div>
        </div>
    );
};

export default Card;
