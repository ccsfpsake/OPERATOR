"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import Image from "next/image";
import styles from "./header.module.css";
import { FaUserCircle, FaCog, FaSignOutAlt, FaCaretDown } from "react-icons/fa";
import { auth, db } from "../../../lib/firebaseConfig";

const Header = ({ isSidebarOpen, toggleSidebar }) => {
  const router = useRouter();
  const [userData, setUserData] = useState({
    FName: "",
    LName: "",
    Avatar: "/noavatar.png",
  });
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const storedUserData = localStorage.getItem("userData");
    if (storedUserData) {
      const parsed = JSON.parse(storedUserData);
      setUserData({
        FName: parsed.FName || "",
        LName: parsed.LName || "",
        Avatar: parsed.Avatar?.trim() || "/noavatar.png",
      });
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userRef = doc(db, "Operator", user.uid);
        const unsubscribeData = onSnapshot(userRef, (docSnapshot) => {
          if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            const formattedData = {
              FName: data.FName || "",
              LName: data.LName || "",
              Avatar: data.Avatar?.trim() || "/noavatar.png",
            };
            setUserData(formattedData);
            localStorage.setItem("userData", JSON.stringify(formattedData));
          }
        });

        return () => unsubscribeData();
      } else {
        setUserData({ FName: "", LName: "", Avatar: "/noavatar.png" });
        localStorage.removeItem("userData");
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("userData");
      router.push("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const toggleDropdown = () => {
    setDropdownVisible((prev) => !prev);
  };

  return (
    <header className={`${styles.header} ${isSidebarOpen ? styles.sidebarOpen : ""}`}>
      {/* Left Section */}
      <div className={styles.left}>
        <button className={styles.burger} onClick={toggleSidebar}>
          ☰
        </button>
      </div>

      {/* Right Section */}
      <div className={styles.right}>
        <div className={styles.profile} onClick={toggleDropdown} ref={dropdownRef}>
          <Image
            src={userData.Avatar || "/noavatar.png"}
            alt="User Avatar"
            width={40}
            height={40}
            className={styles.avatar}
          />
          <div className={styles.nameDropdown}>
            <span className={styles.name}>
              {userData.FName || userData.LName
                ? `${userData.FName} ${userData.LName}`.trim()
                : "Unnamed"}
            </span>
            <FaCaretDown className={styles.dropdownIcon} />
          </div>

          {dropdownVisible && (
            <div className={`${styles.dropdown} ${styles.visible}`}>
              <ul>
                <li onClick={() => router.push("/dashboard/profile")}>
                  <FaUserCircle className={styles.icon} />
                  Profile
                </li>
                <li onClick={() => router.push("/dashboard/account")}>
                  <FaCog className={styles.icon} />
                  Setting
                </li>
                <li onClick={handleLogout}>
                  <FaSignOutAlt className={styles.icon} />
                  Log Out
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
