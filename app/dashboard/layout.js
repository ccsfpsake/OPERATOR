"use client";
import { useState } from "react";
import Sidebar from "../ui/dashboard/sidebar/sidebar";
import Header from "../ui/dashboard/header/header";
import styles from "../ui/dashboard/layout.module.css";
import Navbar from "../ui/dashboard/navbar/navbar";
import Footer from "../ui/dashboard/footer/page";


const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Main content */}
      <div className={`${styles.main} ${isSidebarOpen ? styles.shift : ""}`}>
        <Header isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className={styles.content}><Navbar />{children}<Footer/></div>
      </div>
    </div>
  );
};

export default Layout;
