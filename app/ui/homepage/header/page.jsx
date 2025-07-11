"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { ref, getDownloadURL } from "firebase/storage";
import { storage } from "../../../lib/firebaseConfig";
import headerStyles from "../header/header.module.css";
import { FaBars, FaTimes } from "react-icons/fa";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [logoUrl, setLogoUrl] = useState(null);

  useEffect(() => {
    const logoRef = ref(storage, "Logo/sake.png");

    getDownloadURL(logoRef)
      .then((url) => setLogoUrl(url))
      .catch((error) => console.error("Error fetching logo:", error));
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const sections = ["home", "about", "services", "FAQs", "contact"];
      let currentSection = "";

      sections.forEach((section) => {
        const element = document.getElementById(section);
        if (element && window.scrollY >= element.offsetTop - 100) {
          currentSection = section;
        }
      });

      setActiveSection(currentSection);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLinkClick = () => {
    setMenuOpen(false);
  };

  return (
    <header className={`${headerStyles.header} ${headerStyles.sticky}`}>
      <div className={headerStyles.headerContainer}>
        <div className={headerStyles.brandLogo}>
          <a href="#home" onClick={handleLinkClick}>
            {logoUrl && (
              <Image
                src={logoUrl}
                alt="SAKE Logo"
                width={120}
                height={30}
                priority
                style={{ width: "120px", height: "30px", objectFit: "contain" }}
              />
            )}
          </a>
        </div>

        <div
          className={headerStyles.menuIcon}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </div>

        <nav
          className={`${headerStyles.navMenu} ${
            menuOpen ? headerStyles.active : ""
          }`}
        >
          <ul>
            <li>
              <a
                href="#home"
                className={activeSection === "home" ? headerStyles.active : ""}
                onClick={handleLinkClick}
              >
                HOME
              </a>
            </li>
            <li>
              <a
                href="#about"
                className={activeSection === "about" ? headerStyles.active : ""}
                onClick={handleLinkClick}
              >
                ABOUT
              </a>
            </li>
            <li>
              <a
                href="#services"
                className={
                  activeSection === "services" ? headerStyles.active : ""
                }
                onClick={handleLinkClick}
              >
                SERVICES
              </a>
            </li>
            <li>
              <a
                href="#FAQs"
                className={activeSection === "FAQs" ? headerStyles.active : ""}
                onClick={handleLinkClick}
              >
                FAQs
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
