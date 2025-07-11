"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../../lib/firebaseConfig";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  setDoc,
} from "firebase/firestore";
import {
  getAuth,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Image from "next/image";
import styles from "../../../ui/dashboard/drivers/adddriver.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import CropImageModal from "../../..//dashboard/crop/CropImageModal";

const capitalizeFirstLetter = (str) =>
  str
    .split(" ")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join(" ");

const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const generateDriverID = async (companyID) => {
  const currentYear = new Date().getFullYear();

  const q = query(
    collection(db, "Operator"),
    where("companyID", "==", companyID)
  );
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    throw new Error(
      "Company code not found for companyID: " + companyID
    );
  }

  const companyCode =
    snapshot.docs[0].data().companyCode || "UNK";
  const prefix = `${companyCode}-${currentYear}-`;

  const driversRef = collection(db, "Drivers");
  const allDrivers = await getDocs(driversRef);

  let maxNum = 0;
  allDrivers.forEach((doc) => {
    const id = doc.data().driverID;
    if (id && id.startsWith(prefix)) {
      const parts = id.split("-");
      const num = parseInt(parts[2], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  });

  const nextNumber = (maxNum + 1).toString().padStart(3, "0");
  return `${prefix}${nextNumber}`;
};

const AddDriverPage = () => {
  const [image, setImage] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const email = formData.get("Email");
    const contact = formData.get("Contact");

    const companyID = localStorage.getItem("companyID");
    if (!companyID) {
      setError("Company ID not found. Please login again.");
      return;
    }

    if (!/^[A-Za-z0-9\s-]+$/.test(formData.get("LicenseNo"))) {
      setError("License number must contain only letters, numbers, spaces or hyphens.");
      return;
    }

    if (!/^\d+$/.test(contact)) {
      setError("Contact number must be a valid number.");
      return;
    }

    const emailRegex =
      /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const driverID = await generateDriverID(companyID);

      const driverRef = collection(db, "Drivers");
      const querySnapshot = await getDocs(
        query(driverRef, where("driverID", "==", driverID))
      );

      if (!querySnapshot.empty) {
        toast.error("Driver ID already exists. Try again.", {
          position: "top-right",
          autoClose: 5000,
          theme: "colored",
        });
        setLoading(false);
        return;
      }

      const contactQuery = await getDocs(
        query(driverRef, where("Contact", "==", contact))
      );
      if (!contactQuery.empty) {
        toast.error("Contact already used.", {
          position: "top-right",
          autoClose: 5000,
          theme: "colored",
        });
        setLoading(false);
        return;
      }

      const auth = getAuth();
      const otp = generateOTP();
      await createUserWithEmailAndPassword(auth, email, otp);

      const driverData = {
        driverID,
        LicenseNo: formData.get("LicenseNo"),
        FName: capitalizeFirstLetter(formData.get("FName")),
        MName: capitalizeFirstLetter(formData.get("MName")),
        LName: capitalizeFirstLetter(formData.get("LName")),
        Email: email,
        Contact: contact,
        houseno: capitalizeFirstLetter(formData.get("houseno")),
        Barangay: capitalizeFirstLetter(formData.get("Barangay")),
        City: capitalizeFirstLetter(formData.get("City")),
        Province: capitalizeFirstLetter(formData.get("Province")),
        imageUrl: "",
        companyID,
      };

      const saveDriverData = async (imageUrl = "") => {
        driverData.imageUrl = imageUrl;
        const driverRefDoc = doc(db, "Drivers", driverID);
        await setDoc(driverRefDoc, driverData);

        await fetch("/api/send-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: email,
            type: "driver_account_creation",
            firstName: driverData.FName,
            otp,
          }),
        });

        toast.success("Driver added and email sent.", {
          theme: "colored",
        });

        setTimeout(() => {
          setLoading(false);
          router.push("/dashboard/drivers");
        }, 3000);
      };

      if (croppedImage) {
        const storage = getStorage();
        const imageRef = ref(
          storage,
          "drivers/" + Date.now() + ".jpg"
        );
        const uploadTask = uploadBytesResumable(imageRef, croppedImage);

        uploadTask.on(
          "state_changed",
          null,
          (error) => {
            console.error("Upload error:", error);
            setError("Error uploading image.");
            setLoading(false);
          },
          async () => {
            const imageUrl = await getDownloadURL(
              uploadTask.snapshot.ref
            );
            await saveDriverData(imageUrl);
          }
        );
      } else {
        await saveDriverData();
      }
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        toast.error("Email already used.", {
          position: "top-right",
          autoClose: 5000,
          theme: "colored",
        });
      } else {
        console.error("Driver error:", error);
        setError("Failed to add driver.");
      }
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setCropModalOpen(true);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.imageContainer}>
        {croppedImage ? (
          <Image
            src={URL.createObjectURL(croppedImage)}
            alt="Driver Image"
            width={150}
            height={150}
            className={styles.driverImage}
          />
        ) : (
          <Image
            src="/noavatar.png"
            alt="Driver Image"
            width={150}
            height={150}
            className={styles.driverImage}
          />
        )}
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className={styles.imageInput}
          id="fileInput"
        />
        <label htmlFor="fileInput" className={styles.imageLabel}>
          Choose Image
        </label>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.row}>
          <input
            type="text"
            placeholder="License No."
            name="LicenseNo"
            required
          />
        </div>
        <div className={styles.row}>
          <input
            type="text"
            placeholder="First Name"
            name="FName"
            required
          />
          <input
            type="text"
            placeholder="Middle Name"
            name="MName"
          />
          <input
            type="text"
            placeholder="Last Name"
            name="LName"
            required
          />
        </div>
        <div className={styles.row}>
          <input
            type="tel"
            placeholder="Contact No."
            name="Contact"
            required
          />
          <input
            type="email"
            placeholder="Email"
            name="Email"
            required
          />
        </div>
        <div className={styles.row}>
          <input
            type="text"
            placeholder="House Number"
            name="houseno"
          />
          <input
            type="text"
            placeholder="Barangay"
            name="Barangay"
          />
          <input
            type="text"
            placeholder="City"
            name="City"
            required
          />
          <input
            type="text"
            placeholder="Province"
            name="Province"
            required
          />
        </div>
        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.buttons}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={() => router.push("/dashboard/drivers")}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={styles.addButton}
            disabled={loading}
          >
            {loading ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin /> Saving...
              </>
            ) : (
              "Save"
            )}
          </button>
        </div>
      </form>

      {cropModalOpen && (
        <CropImageModal
          imageFile={image}
          onClose={() => setCropModalOpen(false)}
          onCrop={(cropped) => {
            setCroppedImage(cropped);
            setCropModalOpen(false);
          }}
        />
      )}

      <ToastContainer position="top-right" autoClose={5000} />
    </div>
  );
};

export default AddDriverPage;
