"use client";

import { useState, useEffect } from "react";
import { db } from "../../../../lib/firebaseConfig";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { useRouter, useParams } from "next/navigation";
import styles from "../../../../../app/ui/dashboard/route/edit.module.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const EditRoutePage = () => {
  const { id: driverID } = useParams();
  const router = useRouter();

  const [formData, setFormData] = useState({
    driverID: driverID,
    plateNumber: "N/A",
    route: "N/A",
  });
  const [lineOptions, setLineOptions] = useState([]);
  const [companyID, setCompanyID] = useState("");
  const [message, setMessage] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchLines = async () => {
      try {
        const linesCollection = collection(db, "Lines");
        const linesSnapshot = await getDocs(linesCollection);

        const linesList = linesSnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().Lines,
        }));

        setLineOptions(linesList);
      } catch (err) {
        console.error("Error fetching lines:", err);
        setMessage("Error fetching lines.");
        setShowSuccessModal(true);
        toast.error("Error fetching lines.", { theme: "colored" });
      }
    };

    const fetchRouteData = async () => {
      try {
        const routeDocRef = doc(db, "Route", driverID);
        const routeDocSnap = await getDoc(routeDocRef);

        if (routeDocSnap.exists()) {
          const routeData = routeDocSnap.data();

          setFormData({
            driverID: driverID,
            plateNumber: routeData.plateNumber || "N/A",
            route: routeData.route || "N/A",
          });
        } else {
          console.warn("No route found for this driver. You can create a new route.");
        }
      } catch (error) {
        console.error("Error fetching route data:", error);
        setMessage("Error fetching route data.");
        setShowSuccessModal(true);
        toast.error("Error fetching route data.", { theme: "colored" });
      }
    };

    const fetchCompanyID = async () => {
      try {
        const driverDocRef = doc(db, "Drivers", driverID);
        const driverDocSnap = await getDoc(driverDocRef);

        if (driverDocSnap.exists()) {
          const driverData = driverDocSnap.data();
          setCompanyID(driverData.companyID || "");
        } else {
          console.warn("No driver found for this driverID");
        }
      } catch (error) {
        console.error("Error fetching companyID from Drivers:", error);
        toast.error("Error fetching company data.", { theme: "colored" });
      }
    };

    fetchLines();
    fetchRouteData();
    fetchCompanyID();
  }, [driverID]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const routeDocRef = doc(db, "Route", driverID);
      const routeDocSnap = await getDoc(routeDocRef);

      if (routeDocSnap.exists()) {
        const existingData = routeDocSnap.data();

        const isDataChanged =
          formData.plateNumber !== existingData.plateNumber ||
          formData.route !== existingData.route ||
          companyID !== existingData.companyID;

        if (!isDataChanged) {
          toast.info("No changes detected.", { theme: "colored" });
          setLoading(false);
          return;
        }

        await updateDoc(routeDocRef, {
          plateNumber: formData.plateNumber || "N/A",
          route: formData.route || "N/A",
          companyID: companyID,
        });
        setMessage("Route updated successfully!");
        toast.success("Route updated successfully!", { theme: "colored" });
        setTimeout(() => {
          router.push("/dashboard/route");
        }, 2500);
      } else {
        await setDoc(routeDocRef, {
          driverID: driverID,
          plateNumber: formData.plateNumber || "N/A",
          route: formData.route || "N/A",
          companyID: companyID,
        });
        setMessage("New route created successfully!");
        toast.success("New route created successfully!", { theme: "colored" });
        setTimeout(() => {
          router.push("/dashboard/route");
        }, 2500);
      }

      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error updating or creating route:", error);
      setMessage("Failed to update or create the route. Please try again.");
      setShowSuccessModal(true);
      toast.error("Failed to update or create the route. Please try again.", {
        theme: "colored",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
    router.push("/dashboard/route");
  };

  const handleCancel = () => {
    router.push("/dashboard/route");
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Edit Route</h1>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.row}>
          <label className={styles.label}>Driver ID:</label>
          <input
            className={styles.input}
            type="text"
            name="driverID"
            value={formData.driverID}
            disabled
          />
        </div>

        <div className={styles.row}>
          <label className={styles.label}>Plate Number:</label>
          <input
            className={styles.input}
            type="text"
            name="plateNumber"
            value={formData.plateNumber}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        <div className={styles.row}>
          <label className={styles.label}>Route:</label>
          <select
            className={styles.select}
            name="route"
            value={formData.route}
            onChange={handleChange}
            required
            disabled={loading}
          >
            <option value="">Select Route</option>
            {lineOptions.map((line) => (
              <option key={line.id} value={line.name}>
                {line.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.buttons}>
          <button
            type="button"
            className={styles.cancel}
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button type="submit" className={styles.submit} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </form>

      <ToastContainer position="top-right" autoClose={2000} />
    </div>
  );
};

export default EditRoutePage;
