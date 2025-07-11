import React from "react";
import styles from "./services.module.css";
import { FaStar, FaMapMarkerAlt, FaBusAlt } from 'react-icons/fa';
import { FaPesoSign } from "react-icons/fa6";

const Services = () => {
  return (
    <section id="services" className={`${styles.section} ${styles.servicesSection}`}>
      <h2 className={styles.title}>Our Services</h2>
      <div className={styles.contentWrapper}>
        <div className={styles.cardContainer}>
          <div className={styles.card}>
            <FaMapMarkerAlt size={40} className={styles.icon} />
            <h3>Real-Time Ride Updates</h3>
            <p>Track vehicles live to plan your trip better.</p>
          </div>
          <div className={styles.card}>
            <FaPesoSign size={40} className={styles.icon} />
            <h3>Transparent Fare Estimates</h3>
            <p>View expected fare before starting your journey.</p>
          </div>
          <div className={styles.card}>
            <FaStar size={40} className={styles.icon} />
            <h3>Trusted Driver Details</h3>
            <p>View verified driver identities and vehicle info.</p>
          </div>
          <div className={styles.card}>
            <FaBusAlt size={40} className={styles.icon} />
            <h3>Modern PUJ Integration</h3>
            <p>Link commuters directly to modernized PUJs nearby.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Services;
