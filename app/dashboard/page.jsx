"use client";

import { useEffect, useState, lazy, Suspense } from "react";
import styles from "../ui/dashboard/dashboard.module.css";

import Card from "../ui/dashboard/card/card";
import Card2 from "../ui/dashboard/card/card2";
import Card1 from "../ui/dashboard/card/card1";
import Card4 from "../ui/dashboard/card/card4";
import Status from "../ui/dashboard/status/status";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";

// Lazy load heavy components
const Driversdashboard = lazy(() => import("./drivers/driversdashboard/page"));
const Usergraph = lazy(() => import("./graph/users/page"));
const TopDrivers = lazy(() => import("./graph/driver/TopDrivers"));
const IdleLeaderboard = lazy(() => import("./location/IdleLeaderboard/page"));

const Dashboard = () => {
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    const isLoggedIn = sessionStorage.getItem("isLoggedIn");

    if (!isLoggedIn) {
      window.location.href = "/";
    } else {
      setIsAllowed(true);
    }
  }, []);

  // 🔒 Prevent UI flash if not yet verified
  if (!isAllowed) return null;

  return (
    <div className={styles.container}>
      <div className={styles.main}>

        {/* Cards Section */}
        <div className={styles.cards}>
          <Card4 />
          <Card1 />
          <Card2 />
          <Card />
        </div>

        {/* Driver-related Section */}
        <div className={styles.driverColumn}>
          <Suspense fallback={<LoadingBlock label="Drivers" />}>
            <Driversdashboard />
          </Suspense>

          <Suspense fallback={<LoadingBlock label="Top Drivers" />}>
            <TopDrivers />
          </Suspense>

          <Suspense fallback={<LoadingBlock label="Idle Leaderboard" />}>
            <IdleLeaderboard />
          </Suspense>
        </div>

        {/* Operator Section */}
        <div className={styles.operatorRow}>
          <Status />
          <Suspense fallback={<LoadingBlock label="User Graph" />}>
            <Usergraph />
          </Suspense>
        </div>

      </div>
    </div>
  );
};

const LoadingBlock = ({ label }) => (
  <div className={styles.suspenseBlock}>
    <FontAwesomeIcon icon={faSpinner} spin /> <span>Loading {label}...</span>
  </div>
);

export default Dashboard;
