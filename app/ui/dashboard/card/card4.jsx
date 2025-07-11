"use client"

import { useEffect, useState } from 'react';
import { FaUserAlt } from "react-icons/fa";
import { collection, getCountFromServer } from "firebase/firestore";
import { db } from "../../../lib/firebaseConfig";
import styles from './card.module.css';

const UserCard = () => {
    const [userCount, setUserCount] = useState(0);

    useEffect(() => {
        const fetchUserCount = async () => {
            try {
                const coll = collection(db, 'users');
                const snapshot = await getCountFromServer(coll);
                setUserCount(snapshot.data().count || 0);
            } catch (error) {
                console.error("Error fetching user count:", error);
            }
        };

        fetchUserCount();
    }, []);

    return (
        <div className={styles.card}>
            <div className={styles.texts}>
                <span className={styles.number}>{userCount}</span>
                <span className={styles.title}>Total Commuters</span>
            </div>
            <div className={styles.icon}>
                <FaUserAlt size={28} />
            </div>
        </div>
    );
};

export default UserCard;
