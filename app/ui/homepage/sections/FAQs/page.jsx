"use client";

import { useEffect, useState } from "react";
import { db } from "../../../../lib/firebaseConfig";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { BiChevronDown, BiChevronUp } from "react-icons/bi";
import { FaFacebook, FaInstagram, FaYoutube } from "react-icons/fa";
import { MdEmail, MdPhone } from "react-icons/md";
import styles from "./FAQs.module.css";
import Image from "next/image";

const FAQs = () => {
  const [faqs, setFaqs] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [socialLinks, setSocialLinks] = useState({});

  useEffect(() => {
    const fetchFAQs = async () => {
      const docRef = doc(db, "Setting", "faqs");
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const generalFAQs = data?.faqs?.General || [];

        const cleanedFAQs = generalFAQs.filter(
          (faq) =>
            faq &&
            faq.question &&
            faq.category &&
            Array.isArray(faq.directions)
        );

        setFaqs(cleanedFAQs);
      }
    };

    fetchFAQs();

    const socialDocRef = doc(db, "Setting", "Social Media Accounts");
    const unsubscribe = onSnapshot(socialDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setSocialLinks(docSnap.data());
      }
    });

    return () => unsubscribe();
  }, []);

  const toggleFAQ = (index) => {
    setExpanded(expanded === index ? null : index);
  };

  return (
    <section id="FAQs" className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>FAQs</h2>
        <p className={styles.subtitle}>
          Have questions? Find the answers most valued by our users, along with
          step-by-step instructions and support.
        </p>
      </div>

      <div className={styles.faqContent}>
        {faqs.map((faq, index) => (
          <div key={index} className={styles.faqItem}>
            <button
              className={styles.question}
              onClick={() => toggleFAQ(index)}
              aria-expanded={expanded === index}
              aria-controls={`faq-answer-${index}`}
              id={`faq-question-${index}`}
            >
              {faq.question}
              {expanded === index ? (
                <BiChevronUp className={`${styles.icon} ${styles.rotate}`} />
              ) : (
                <BiChevronDown className={styles.icon} />
              )}
            </button>
            {expanded === index && (
              <div
                id={`faq-answer-${index}`}
                className={styles.answer}
                role="region"
                aria-labelledby={`faq-question-${index}`}
              >
                {faq.directions.map((step, i) => (
                  <div key={i} className={styles.direction}>
                    <p>{step.text}</p>
                    {step.imageUrl && step.imageUrl !== "" && (
                      <Image
                        src={step.imageUrl}
                        alt={`Step ${i + 1}`}
                        width={300}
                        height={200}
                        style={{ maxWidth: "100%", height: "auto" }}
                        unoptimized 
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {Object.keys(socialLinks).length > 0 && (
        <div className={styles.contactBox}>
          <p className={styles.contactText}>
            If you have more questions, feel free to reach us through:
          </p>
          <ul className={styles.socialLinks}>
            {socialLinks.Facebook && (
              <li>
                <a
                  href={socialLinks.Facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaFacebook
                    style={{ color: "#1877F2" }}
                    className={styles.socialIcon}
                  />{" "}
                  Facebook
                </a>
              </li>
            )}
            {socialLinks.Instagram && (
              <li>
                <a
                  href={socialLinks.Instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaInstagram
                    style={{ color: "#E1306C" }}
                    className={styles.socialIcon}
                  />{" "}
                  Instagram
                </a>
              </li>
            )}
            {socialLinks.YouTube && (
              <li>
                <a
                  href={socialLinks.YouTube}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaYoutube
                    style={{ color: "#FF0000" }}
                    className={styles.socialIcon}
                  />{" "}
                  YouTube
                </a>
              </li>
            )}
          </ul>

          {socialLinks.Email && (
            <div className={styles.contactRow}>
              <MdEmail
                style={{ color: "#EA4335" }}
                className={styles.socialIcon}
              />
              <span>Email us at: {socialLinks.Email}</span>
            </div>
          )}

          {socialLinks.Phone && (
            <div className={styles.contactRow}>
              <MdPhone
                style={{ color: "#34A853" }}
                className={styles.socialIcon}
              />
              <span>Call or text us at: {socialLinks.Phone}</span>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default FAQs;
