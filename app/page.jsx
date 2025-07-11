"use client";
import React, { useState, useEffect } from "react";
import Services from "../app/ui/homepage/sections/services/page";
import styles from "../app/ui/homepage/homepage.module.css";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import Link from "next/link";
import FAQs from "./ui/homepage/sections/FAQs/page";
import About from "./ui/homepage/sections/About/page";
import Header from "./ui/homepage/header/page";

const HomePage = () => {
  const [activeSection, setActiveSection] = useState("home");
  const [logoUrl, setLogoUrl] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      const sections = ["about", "services", "portfolio", "contact"];
      const scrollY = window.scrollY;

      sections.forEach((section) => {
        const element = document.getElementById(section);
        if (element && scrollY >= element.offsetTop - 100) {
          setActiveSection(section);
        }
      });
    };

    const fetchLogoImage = async () => {
      const storage = getStorage();
      const imageRef = ref(storage, "Logo/logo.png");
      try {
        const url = await getDownloadURL(imageRef);
        setLogoUrl(url);
      } catch (error) {
        console.error("Error fetching logo image:", error);
      }
    };

    fetchLogoImage();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!logoUrl) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className={styles.homeContainer}>
      <Header activeSection={activeSection} />

      <section id="home" className={styles.heroSection}>

        <div className={styles.heroContent}>
          <h1>
            Welcome to SAKE
          </h1>
          <h1><span className={styles.highlight}>OPERATOR PAGE</span></h1>
          <p>Your reliable transport solution, making commuting easier and more efficient.</p>

          {/* Login Button */}
          <div className={styles.buttonContainer}>
            <Link href="/login" className={styles.button}>
              Login
            </Link>
            <Link href="/signup" className={styles.button}>
              Signup
            </Link>
          </div>
        </div>
      </section>

      {/* Other Sections */}
      <About />
      <Services />
      <FAQs />
    </div>
  );
};

export default HomePage;
