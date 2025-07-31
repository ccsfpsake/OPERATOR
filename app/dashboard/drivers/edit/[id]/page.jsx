/* eslint-env es6, browser */

"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../../lib/firebaseConfig";
import { useParams, useRouter } from "next/navigation";
import { FaCamera } from "react-icons/fa";
import Image from "next/image";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import CropImageModal from "../../../../dashboard/crop/CropImageModal";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "../../../../ui/dashboard/drivers/driveredit.module.css";

const EditDriverPage = () => {
  const { id } = useParams();
  const router = useRouter();

  const [driver, setDriver] = useState(null);
  const [formData, setFormData] = useState({
    driverID: "",
    LicenseNo: "",
    FName: "",
    LName: "",
    MName: "",
    Email: "",
    Contact: "",
    houseno: "",
    Barangay: "",
    City: "",
    Province: "",
    avatarUrl: "",
  });

  const [newAvatar, setNewAvatar] = useState(null);
  const [image, setImage] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch existing driver details
  useEffect(() => {
    const fetchDriver = async () => {
      try {
        const docRef = doc(db, "Drivers", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setDriver({ id: docSnap.id, ...data });
          setFormData({
            driverID: data.driverID || "",
            LicenseNo: data.LicenseNo || "",
            FName: data.FName || "",
            LName: data.LName || "",
            MName: data.MName || "",
            Email: data.Email || "",
            Contact: data.Contact || "",
            houseno: data.houseno || "",
            Barangay: data.Barangay || "",
            City: data.City || "",
            Province: data.Province || "",
            avatarUrl: data.imageUrl || "/noavatar.png",
          });
        } else {
          toast.error("Driver not found.");
        }
      } catch (error) {
        console.error("Error fetching driver:", error);
        toast.error("Failed to fetch driver.");
      }
    };

    fetchDriver();
  }, [id]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };


  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setCropModalOpen(true);
    }
  };

  // Update avatar preview after cropping
  useEffect(() => {
    if (croppedImage) {
      setNewAvatar(croppedImage);
      setFormData((prev) => ({
        ...prev,
        avatarUrl: URL.createObjectURL(croppedImage),
      }));
    }
  }, [croppedImage]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const isDataChanged =
      formData.FName !== driver.FName ||
      formData.LName !== driver.LName ||
      formData.MName !== driver.MName ||
      formData.Contact !== driver.Contact ||
      formData.houseno !== driver.houseno ||
      formData.Barangay !== driver.Barangay ||
      formData.City !== driver.City ||
      formData.Province !== driver.Province;

    const isAvatarChanged = !!newAvatar;

    if (!isDataChanged && !isAvatarChanged) {
      toast.info("No changes detected.", { theme: "colored" });
      setLoading(false);
      return;
    }

    const fullAddress = `${formData.houseno}, ${formData.Barangay}, ${formData.City}, ${formData.Province}`;
    const driverData = {
      driverID: formData.driverID,
      LicenseNo: formData.LicenseNo,
      FName: formData.FName.trim(),
      LName: formData.LName.trim(),
      MName: formData.MName.trim(),
      Email: formData.Email,
      Contact: formData.Contact.trim(),
      houseno: formData.houseno.trim(),
      Barangay: formData.Barangay.trim(),
      City: formData.City.trim(),
      Province: formData.Province.trim(),
      Address: fullAddress,
    };

    try {
      const storage = getStorage();
      const docRef = doc(db, "Drivers", id);

      // Upload new avatar if available
      if (newAvatar) {
        const newImageRef = ref(storage, `drivers/${formData.driverID}_${Date.now()}`);

        // Delete old image from storage
        if (driver.imageUrl && driver.imageUrl !== "/noavatar.png") {
          const match = driver.imageUrl.match(/%2F(.+)\?alt/);
          if (match && match[1]) {
            const oldPath = decodeURIComponent(match[1]);
            const oldImageRef = ref(storage, `drivers/${oldPath}`);
            try {
              await deleteObject(oldImageRef);
            } catch (error) {
              console.warn("Failed to delete old image:", error.message);
            }
          }
        }

        // Upload and get new image URL
        const uploadTask = uploadBytesResumable(newImageRef, newAvatar);
        const snapshot = await new Promise((resolve, reject) => {
          uploadTask.on("state_changed", null, reject, () => resolve(uploadTask.snapshot));
        });
        const downloadURL = await getDownloadURL(snapshot.ref);
        driverData.imageUrl = downloadURL;
      } else {
        driverData.imageUrl = driver.imageUrl;
      }

      // Save updated data to database
      await updateDoc(docRef, driverData);

      toast.success("Driver updated successfully!", { theme: "colored" });
      setTimeout(() => {
        router.push("/dashboard/drivers");
      }, 2000);
    } catch (error) {
      console.error("Error updating driver:", error);
      toast.error("Failed to update driver.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/dashboard/drivers");
  };

  if (!driver) return <div>Loading...</div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Edit Driver</h1>
      <form className={styles.form} onSubmit={handleSubmit}>

        <div className={styles.imageContainer}>
          <Image
            src={formData.avatarUrl}
            alt="Avatar"
            width={130}
            height={130}
            className={styles.avatarPreview}
          />
          <input
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            id="avatarInput"
            style={{ display: "none" }}
          />
          <label htmlFor="avatarInput" className={styles.editIcon}>
            <FaCamera />
          </label>
        </div>

        {/* Row 1: ID + License */}
        <div className={styles.row}>
          <div className={styles.col}>
            <label className={styles.label}>Driver ID:</label>
            <input className={styles.input} name="driverID" value={formData.driverID} disabled />
          </div>
          <div className={styles.col}>
            <label className={styles.label}>License No.:</label>
            <input className={styles.input} name="LicenseNo" value={formData.LicenseNo} disabled />
          </div>
        </div>

        {/* Row 2: Name */}
        <div className={styles.row}>
          <div className={styles.col}>
            <label className={styles.label}>First Name:</label>
            <input className={styles.input} name="FName" value={formData.FName} onChange={handleChange} />
          </div>
          <div className={styles.col}>
            <label className={styles.label}>Middle Name:</label>
            <input className={styles.input} name="MName" value={formData.MName} onChange={handleChange} />
          </div>
          <div className={styles.col}>
            <label className={styles.label}>Last Name:</label>
            <input className={styles.input} name="LName" value={formData.LName} onChange={handleChange} />
          </div>
        </div>

        {/* Row 3: Email + Contact */}
        <div className={styles.row}>
          <div className={styles.col}>
            <label className={styles.label}>Email:</label>
            <input className={styles.input} name="Email" value={formData.Email} disabled />
          </div>
          <div className={styles.col}>
            <label className={styles.label}>Contact:</label>
            <input className={styles.input} name="Contact" value={formData.Contact} onChange={handleChange} />
          </div>
        </div>

        {/* Row 4: Address */}
        <div className={styles.row}>
          <div className={styles.col}>
            <label className={styles.label}>House No.:</label>
            <input className={styles.input} name="houseno" value={formData.houseno} onChange={handleChange} />
          </div>
          <div className={styles.col}>
            <label className={styles.label}>Barangay:</label>
            <input className={styles.input} name="Barangay" value={formData.Barangay} onChange={handleChange} />
          </div>
          <div className={styles.col}>
            <label className={styles.label}>City:</label>
            <input className={styles.input} name="City" value={formData.City} onChange={handleChange} />
          </div>
          <div className={styles.col}>
            <label className={styles.label}>Province:</label>
            <input className={styles.input} name="Province" value={formData.Province} onChange={handleChange} />
          </div>
        </div>

        {/* Buttons */}
        <div className={styles.buttons}>
          <button type="button" className={styles.cancel} onClick={handleCancel} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className={styles.submit} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </form>

      {/* Image crop modal */}
      {cropModalOpen && (
        <CropImageModal
          imageFile={image}
          onClose={() => setCropModalOpen(false)}
          onCrop={(croppedFile) => {
            setCroppedImage(croppedFile);
            setCropModalOpen(false);
          }}
        />
      )}

      <ToastContainer position="top-right" autoClose={2000} />
    </div>
  );
};

export default EditDriverPage;
