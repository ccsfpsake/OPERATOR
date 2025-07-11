"use client";
import "react-toastify/dist/ReactToastify.css";
import { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import Link from "next/link";
import { auth, db } from "../lib/firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import {
  doc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  getDoc,
} from "firebase/firestore";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styles from "../ui/signup/signup.module.css";
import { FaCircleExclamation } from "react-icons/fa6";
import { FaTimes } from "react-icons/fa";

const generateOperatorID = async (companyID) => {
  const year = new Date().getFullYear();
  const words = companyID.trim().split(/\s+/);
  let baseCode = words.map((word) => word[0]?.toUpperCase()).join("").slice(0, 3);
  if (!baseCode) baseCode = "XX";

  let companyCode = baseCode;
  let suffix = 0;
  let found = false;

  while (!found) {
    const q = query(collection(db, "Operator"), where("companyCode", "==", companyCode));
    const snapshot = await getDocs(q);

    const isSameCompany = snapshot.docs.some(
      (doc) => doc.data().companyID.toLowerCase() === companyID.toLowerCase()
    );

    if (snapshot.empty || isSameCompany) {
      found = true;
      break;
    }

    suffix++;
    companyCode = `${baseCode}${suffix}`;
  }

  const operatorRef = collection(db, "Operator");
  const operatorQuery = query(operatorRef, where("companyCode", "==", companyCode));
  const operatorSnapshot = await getDocs(operatorQuery);

  const sameYearOperators = operatorSnapshot.docs.filter((doc) => {
    const opID = doc.data().operatorID || "";
    return opID.includes(`-${year}-`);
  });

  const sequence = sameYearOperators.length + 1;
  const paddedSeq = String(sequence).padStart(3, "0");

  const operatorID = `${companyCode}-${year}-${paddedSeq}`;

  return { companyCode, operatorID };
};

const SignupPage = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    FName: "",
    MName: "",
    LName: "",
    Email: "",
    Contact: "",
    Password: "",
    ConfirmPassword: "",
    Role: "Operator",
    companyID: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [contactInfo, setContactInfo] = useState({ Email: "", Phone: "" });
  const router = useRouter();

  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        const docRef = doc(db, "Setting", "Social Media Accounts");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setContactInfo({
            Email: data.Email || "",
            Phone: data.Phone || "",
          });
        }
      } catch (error) {
        console.error("Error fetching contact info:", error);
      }
    };
    fetchContactInfo();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (currentStep === 1) {
      setPasswordError("");
      setConfirmError("");

      let hasError = false;

      if (formData.Password.length < 6) {
        setPasswordError("Password must be at least 6 characters.");
        hasError = true;
      }

      if (formData.Password !== formData.ConfirmPassword) {
        setConfirmError("Passwords do not match.");
        hasError = true;
      }

      if (hasError) return;

      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!termsAccepted) {
        toast.info("You must accept the terms and conditions to continue.");
        return;
      }

      setLoading(true);
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.Email,
          formData.Password
        );

        const { companyCode, operatorID } = await generateOperatorID(formData.companyID);

        await setDoc(doc(db, "Operator", userCredential.user.uid), {
          FName: formData.FName,
          MName: formData.MName,
          LName: formData.LName,
          Email: formData.Email,
          Contact: formData.Contact,
          Status: "pending",
          companyID: formData.companyID,
          companyCode: companyCode,
          operatorID: operatorID,
        });

        setShowModal(true);
        setFormData({
          FName: "",
          MName: "",
          LName: "",
          Email: "",
          Contact: "",
          Password: "",
          ConfirmPassword: "",
          Role: "Operator",
          companyID: "",
        });
      } catch (error) {
        if (error.code === "auth/email-already-in-use") {
          toast.error("The email address is already in use.");
        } else {
          toast.error("An error occurred. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    toast.success("Signup complete! Wait for the verification email.");
    setTimeout(() => router.push("/login"), 2000);
  };

  return (
    <div className={styles.container}>
      <div className={styles.logoSection}>
        <Image
          src="/signup.png"
          alt="Signup Logo"
          className={styles.logo}
          width={700}
          height={400}
          priority
        />
      </div>

      <div className={styles.card}>
        <h1 className={styles.title}>Operator Signup</h1>

        <div className={styles.progressBar}>
          {["Account Credentials", "Personal Information", "Preview Information"].map((label, idx) => (
            <div key={idx} className={`${styles.step} ${currentStep >= idx + 1 ? styles.completed : ""}`}>
              <div className={styles.stepNumber}>{idx + 1}</div>
              <div className={styles.stepLabel}>{label}</div>
              {idx < 2 && <div className={styles.stepSeparator} />}
            </div>
          ))}
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {currentStep === 1 && (
            <>
              <div className={styles.inputGroup}>
                <label htmlFor="companyID" className={styles.label}>Company ID*</label>
                <input
                  type="text"
                  id="companyID"
                  name="companyID"
                  className={styles.input}
                  value={formData.companyID}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="Email" className={styles.label}>Email Address*</label>
                <input
                  type="email"
                  id="Email"
                  name="Email"
                  className={styles.input}
                  value={formData.Email}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      Email: e.target.value.toLowerCase(),
                    }))
                  }
                  required
                />
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="Password" className={styles.label}>Password*</label>
                <input
                  type="password"
                  id="Password"
                  name="Password"
                  className={styles.input}
                  value={formData.Password}
                  onChange={handleChange}
                  required
                  title="Password must be at least 6 characters long."
                />
                {passwordError && <p className={styles.error}>{passwordError}</p>}
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="ConfirmPassword" className={styles.label}>Confirm Password*</label>
                <input
                  type="password"
                  id="ConfirmPassword"
                  name="ConfirmPassword"
                  className={styles.input}
                  value={formData.ConfirmPassword}
                  onChange={handleChange}
                  required
                  title="Make sure this matches the password above."
                />
                {confirmError && <p className={styles.error}>{confirmError}</p>}
              </div>
            </>
          )}

          {currentStep === 2 && (
            <>
              <div className={styles.nameRow}>
                <div className={styles.inputGroup}>
                  <label htmlFor="FName" className={styles.label}>First Name*</label>
                  <input
                    type="text"
                    id="FName"
                    name="FName"
                    className={styles.input}
                    value={formData.FName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label htmlFor="MName" className={styles.label}>Middle Name</label>
                  <input
                    type="text"
                    id="MName"
                    name="MName"
                    className={styles.input}
                    value={formData.MName}
                    onChange={handleChange}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label htmlFor="LName" className={styles.label}>Last Name*</label>
                  <input
                    type="text"
                    id="LName"
                    name="LName"
                    className={styles.input}
                    value={formData.LName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="Contact" className={styles.label}>Phone Number*</label>
                <input
                  type="tel"
                  id="Contact"
                  name="Contact"
                  className={styles.input}
                  value={formData.Contact}
                  onChange={handleChange}
                  pattern="[0-9]*"
                  onInvalid={(e) => e.target.setCustomValidity("Numbers only")}
                  onInput={(e) => e.target.setCustomValidity("")}
                  required
                />
              </div>
            </>
          )}

          {currentStep === 3 && (
            <div className={styles.preview}>
              <h3>Preview Your Information</h3>
              <p><strong>Email:</strong> {formData.Email}</p>
              <p><strong>Company ID:</strong> {formData.companyID}</p>
              <p><strong>First Name:</strong> {formData.FName}</p>
              <p><strong>Middle Name:</strong> {formData.MName}</p>
              <p><strong>Last Name:</strong> {formData.LName}</p>
              <p><strong>Contact:</strong> {formData.Contact}</p>
              <div className={styles.inputGroup}>
                <input
                  type="checkbox"
                  id="terms"
                  name="terms"
                  checked={termsAccepted}
                  onChange={() => setTermsAccepted(!termsAccepted)}
                />
                <label htmlFor="terms" className={styles.label}>
                  I agree to the{" "}
                  <span className={styles.link} onClick={() => setShowTermsModal(true)}>
                    terms and conditions
                  </span>.
                </label>
              </div>
            </div>
          )}

          <div className={styles.buttonGroup}>
            {currentStep > 1 && (
              <button type="button" onClick={() => setCurrentStep(currentStep - 1)} className={`${styles.button} ${styles.grayButton}`} disabled={loading}>
                Previous
              </button>
            )}
            {currentStep < 3 && (
              <button type="submit" className={`${styles.button} ${styles.blueButton}`} disabled={loading}>
                Next
              </button>
            )}
            {currentStep === 3 && (
              <button type="submit" className={`${styles.button} ${styles.blueButton}`} disabled={loading}>
                {loading ? "Processing..." : "Submit"}
              </button>
            )}
          </div>
        </form>

        <div className={styles.loginLink}>
          <p>
            Already have an account? <Link href="/login" className={styles.link}>Login here</Link>
          </p>
        </div>

        {showModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <div className={styles.icon}>
                <FaCircleExclamation className={styles.icons} />
              </div>
              <p>Your account is pending verification. Please wait for the email.</p>
              <button onClick={handleCloseModal} className={`${styles.parentContainer} ${styles.okButton}`}>OK</button>
            </div>
          </div>
        )}
      </div>

      {showTermsModal && (
      <div className={styles.modalOverlay}>
        <div className={styles.modalterm}>
          <button onClick={() => setShowTermsModal(false)} className={styles.closeButton}>
            <FaTimes size={20} />
          </button>
          <h2>Terms and Conditions</h2>
          <p>
            By registering as an Operator on the SAKE Transport System, you agree to comply with the following terms and conditions:
          </p>
          <div>
            <strong>Account Responsibilities</strong>
            <p>
              You are responsible for maintaining the confidentiality of your login credentials and for ensuring that all provided information is accurate and up-to-date. Operators must manage their assigned accounts and data with care and integrity.
            </p>

            <strong>Authorized Use</strong>
            <p>
              The platform must only be used for lawful purposes related to the operation and management of the transport system. Operators are expected to fulfill their designated roles and comply with SAKE’s usage guidelines.
            </p>

            <strong>Prohibited Activities</strong>
            <p>
              Operators are strictly prohibited from sharing login credentials, engaging in unauthorized access, misusing driver or commuter data, or using the platform for any illegal activity.
            </p>

            <strong>Privacy and Data Protection</strong>
            <p>
              SAKE is committed to protecting the privacy of all users. Operators are expected to maintain the confidentiality of personal and operational data in accordance with SAKE’s Privacy Policy.
            </p>

            <strong>Account Suspension and Termination</strong>
            <p>
              SAKE reserves the right to suspend or terminate operator accounts found in violation of these terms or involved in harmful or unauthorized activities.
            </p>
            <strong>Contact</strong>
            <p>
              {contactInfo.Email
                ? `Email us at ${contactInfo.Email}${contactInfo.Phone ? ` or call us at ${contactInfo.Phone}` : ""} for any questions.`
                : "For any questions, please contact us through the provided channels."}
            </p>
          </div>
          <div className={styles.buttonmodal}>
            <button onClick={() => { setTermsAccepted(true); setShowTermsModal(false); }} className={`${styles.button} ${styles.agreeButton}`}>
              Agree
            </button>
          </div>
        </div>
      </div>
    )}
      <ToastContainer theme="colored" position="top-right" autoClose={2000} />
    </div>
  );
};

export default SignupPage;

