"use client";

import { useEffect, useState } from "react";
import styles from "../ui/dashboard/dashboard.module.css";

import Card from "../ui/dashboard/card/card";
import Card2 from "../ui/dashboard/card/card2";
import Card1 from "../ui/dashboard/card/card1";
import Card4 from "../ui/dashboard/card/card4";
import Status from "../ui/dashboard/status/status";

// Direct component imports (no lazy)
import Driversdashboard from "./drivers/driversdashboard/page";
import Usergraph from "./graph/users/page";
import TopDrivers from "./graph/driver/TopDrivers";
import IdleLeaderboard from "./location/IdleLeaderboard/page";

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
          <Driversdashboard />
          <TopDrivers />
          <IdleLeaderboard />
        </div>

        {/* Operator Section */}
        <div className={styles.operatorRow}>
          <Status />
          <Usergraph />
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
