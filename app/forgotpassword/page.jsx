"use client";

import React, { useState } from "react";
import { auth, db } from "../../app/lib/firebaseConfig";
import { sendPasswordResetEmail } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "../../app/ui/login/login.module.css";
import Link from "next/link";
import Image from "next/image";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {

      const q = query(collection(db, "Operator"), where("Email", "==", email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {

        toast.error("No Operator account found with this email.", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "colored",
        });
        setLoading(false);
        return;
      }

      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset email sent successfully!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
      });
    } catch (error) {
      console.log("Error sending password reset email:", error);
      if (error.code === "auth/invalid-email") {
        toast.error("Invalid email format. Please check and try again.", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "colored",
        });
      } else {
        toast.error("Failed to send password reset email. Please try again later.", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "colored",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.logoSection}>
        <div className={styles.logoSection}>
        <Image
          src="/forgotpass.png"
          alt="Forgot Password Logo"
          className={styles.logo}
          width={700}
          height={400}
          priority
        />
      </div>
      </div>
      <div className={styles.card}>
        <h1 className={styles.title}>Reset Password</h1>
        <form className={styles.form} onSubmit={handlePasswordReset}>
          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.label}>Email</label>
            <input
              type="email"
              id="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? "Sending..." : "Send Reset Email"}
          </button>
        </form>
        <div className={styles.loginLink}>
        <Link href="/login" className={styles.link}>Login here</Link>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default ForgotPasswordPage;
