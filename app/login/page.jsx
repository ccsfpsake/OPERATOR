"use client";

import React, { useState, useCallback } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import styles from "../../app/ui/login/login.module.css";
import { auth, db } from "../lib/firebaseConfig";
import Image from 'next/image';

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    const normalizedEmail = email.trim().toLowerCase();

    // Quick email format check
    if (!/\S+@\S+\.\S+/.test(normalizedEmail)) {
      setErrorMessage("Invalid email format.");
      setLoading(false);
      return;
    }

    try {
      const q = query(collection(db, "Operator"), where("Email", "==", normalizedEmail));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast.error("No operator found with this email.", {
          position: "top-right",
          autoClose: 3000,
          theme: "colored",
        });
        setLoading(false);
        return;
      }

      const operatorData = querySnapshot.docs[0].data();
      const status = operatorData.Status?.toLowerCase() || "";

      const toastMap = {
        pending: "Your account is pending approval. Please wait for verification.",
        suspended: "Your account is suspended. Contact support at ccsfpsake@gmail.com.",
        default: "Your account is not verified. Please contact support.",
      };

      if (status !== "verified") {
        toast.info(toastMap[status] || toastMap.default, {
          position: "top-right",
          autoClose: 4000,
          theme: "colored",
        });
        setLoading(false);
        return;
      }

      const companyID = operatorData.companyID?.trim();
      if (!companyID) {
        toast.error("Company ID missing for this operator.", {
          position: "top-right",
          autoClose: 3000,
          theme: "colored",
        });
        setLoading(false);
        return;
      }

      await signInWithEmailAndPassword(auth, normalizedEmail, password);
      localStorage.setItem("companyID", companyID);
      sessionStorage.setItem("isLoggedIn", "true");
      router.push("/dashboard");

    } catch (error) {
      const code = error.code;
      let message = "An error occurred. Please try again.";

      if (code === "auth/user-not-found" || code === "auth/invalid-email") {
        message = "No operator found or email is invalid.";
      } else if (code === "auth/wrong-password") {
        message = "Password is incorrect. Please try again.";
      }

      setErrorMessage(message);
      setLoading(false);
    }
  }, [email, password, router]);

  return (
    <div className={styles.container}>
      <div className={styles.logoSection}>
        <Image
        src="/login.png"
        alt="Login Logo"
        className={styles.logo}
        width={700}
        height={400}
        priority
      />
      </div>
      <div className={styles.card}>
        <h1 className={styles.title}>Operator Login</h1>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.label}>Email</label>
            <input
              type="email"
              id="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>Password</label>
            <input
              type="password"
              id="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {errorMessage && <p className={styles.error}>{errorMessage}</p>}

          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin /> Logging in...
              </>
            ) : (
              "Login"
            )}
          </button>
        </form>

        <div className={styles.links}>
          <Link href="/forgotpassword" className={styles.link}>
            Forgot Password?
          </Link>
        </div>
        <div className={styles.loginLink}>
          <p>
            <Link href="/signup" className={styles.link}>Sign Up</Link>
          </p>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default LoginPage;
