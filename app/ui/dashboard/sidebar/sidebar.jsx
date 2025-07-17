// "use client";

// import { useEffect, useState } from "react";
// import MenuLink from "./menuLink/menuLink";
// import styles from "./sidebar.module.css";
// import { FaHistory, FaTimes } from "react-icons/fa";
// import { IoBusOutline } from "react-icons/io5";
// import { TbBusStop } from "react-icons/tb";
// import {
//   MdDashboard,
//   MdPerson,
//   MdRoute,
//   MdReportGmailerrorred,
//   MdOutlinePolicy,
// } from "react-icons/md";
// import { getStorage, ref, getDownloadURL } from "firebase/storage";
// import {
//   collection,
//   query,
//   where,
//   onSnapshot,
//   getDocs,
// } from "firebase/firestore";
// import { db } from "../../../lib/firebaseConfig";
// import Image from "next/image";

// const menuItems = [
//   {
//     title: "   PAGES",
//     list: [
//       {
//         title: "Dashboard",
//         path: "/dashboard",
//         icon: <MdDashboard className={styles.icon} />,
//       },
//       {
//         title: "Drivers",
//         path: "/dashboard/drivers",
//         icon: <MdPerson className={styles.icon} />,
//       },
//       {
//         title: "Routes",
//         path: "/dashboard/route",
//         icon: <MdRoute className={styles.icon} />,
//       },
//       {
//         title: "Stops",
//         path: "/dashboard/stops",
//         icon: <TbBusStop className={styles.icon} />,
//       },
//       {
//         title: "Location",
//         path: "/dashboard/location",
//         icon: <IoBusOutline className={styles.icon} />,
//       },
//       {
//         title: "History",
//         path: "/dashboard/history",
//         icon: <FaHistory className={styles.icon} />,
//       },
//       {
//         title: "Reports",
//         path: "/dashboard/report",
//         icon: <MdReportGmailerrorred className={styles.icon} />,
//       },
//     ],
//   },
//   {
//     title: "   USER",
//     list: [
//       {
//         title: "Term of Use",
//         path: "/dashboard/terms",
//         icon: <MdOutlinePolicy className={styles.icon} />,
//       },
//     ],
//   },
// ];

// const Sidebar = ({ isSidebarOpen, toggleSidebar }) => {
//   const [logoUrl, setLogoUrl] = useState("");
//   const [hasUnreadReports, setHasUnreadReports] = useState(false);
//   const [hasIdleBuses, setHasIdleBuses] = useState(false);

//   const isAtCityCollege = (location) => {
//     const targetLat = 15.06137;
//     const targetLng = 120.643928;
//     const threshold = 0.0002;
//     if (!location) return false;
//     const latDiff = Math.abs(location.latitude - targetLat);
//     const lngDiff = Math.abs(location.longitude - targetLng);
//     return latDiff < threshold && lngDiff < threshold;
//   };

//   useEffect(() => {
//     const cachedUrl = localStorage.getItem("sakeLogo");
//     if (cachedUrl) {
//       setLogoUrl(cachedUrl);
//     } else {
//       const fetchLogo = async () => {
//         try {
//           const storage = getStorage();
//           const logoRef = ref(storage, "Logo/sake.png");
//           const url = await getDownloadURL(logoRef);
//           setLogoUrl(url);
//           localStorage.setItem("sakeLogo", url);
//         } catch (error) {
//           console.error("Error fetching sake logo:", error);
//         }
//       };
//       fetchLogo();
//     }
//   }, []);

//   useEffect(() => {
//     const companyID = localStorage.getItem("companyID");
//     if (!companyID) return;

//     const reportQuery = query(
//       collection(db, "busReports"),
//       where("companyID", "==", companyID)
//     );

//     let unsubMessageListeners = [];

//     const unsubReports = onSnapshot(reportQuery, (snapshot) => {
//       unsubMessageListeners.forEach((unsub) => unsub()); // Clean previous
//       unsubMessageListeners = [];

//       let reportsStatus = {};

//       snapshot.docs.forEach((docSnap) => {
//         const reportID = docSnap.id;
//         const reportData = docSnap.data();

//         const messagesRef = collection(db, "busReports", reportID, "messages");

//         const unsubMsg = onSnapshot(messagesRef, (msgSnap) => {
//           const messages = msgSnap.docs.map((d) => d.data());
//           const hasMessages = messages.length > 0;
//           const hasUnreadAdmin = messages.some(
//             (msg) => msg.senderRole === "admin" && msg.seen === false
//           );

//           const isNewUnread = !hasMessages && !reportData.operatorSeen;

//           reportsStatus[reportID] = hasUnreadAdmin || isNewUnread;

//           const hasAnyUnread = Object.values(reportsStatus).some((v) => v === true);
//           setHasUnreadReports(hasAnyUnread);
//         });

//         unsubMessageListeners.push(unsubMsg);
//       });
//     });

//     const unsubIdle = onSnapshot(collection(db, "BusLocation"), async (snapshot) => {
//       const driversSnapshot = await getDocs(collection(db, "Drivers"));
//       const driversMap = {};
//       driversSnapshot.forEach((doc) => {
//         const data = doc.data();
//         driversMap[data.driverID] = data;
//       });

//       const now = new Date();
//       const idleBuses = snapshot.docs.filter((doc) => {
//         const data = doc.data();
//         const driver = driversMap[data.driverID];
//         const isSameCompany = driver?.companyID === companyID;
//         const isActive = driver?.status === "active";
//         const lastUpdate = data.lastUpdated?.toDate?.();
//         const location = data.currentLocation;

//         if (!lastUpdate || !isSameCompany || !isActive) return false;

//         const diffMin = (now - lastUpdate) / 60000;

//         if (isAtCityCollege(location)) {
//           return diffMin >= 10;
//         }

//         return diffMin >= 3;
//       });

//       setHasIdleBuses(idleBuses.length > 0);
//     });

//     return () => {
//       unsubReports();
//       unsubIdle();
//       unsubMessageListeners.forEach((u) => u());
//     };
//   }, []);

//   return (
//     <div className={`${styles.container} ${isSidebarOpen ? styles.open : styles.closed}`}>
//       <div className={styles.header}>
//         <Image
//           src={logoUrl || "/Logo.png"}
//           alt="SAKE Logo"
//           width={150}
//           height={60}
//           className={styles.logo}
//           loading="lazy"
//         />
//         <button className={styles.closeButton} onClick={toggleSidebar}>
//           <FaTimes />
//         </button>
//       </div>

//       <ul className={styles.list}>
//         {menuItems.map((cat) => (
//           <li key={cat.title}>
//             <span className={styles.cat}>{cat.title}</span>
//             {cat.list.map((item) => (
//               <MenuLink
//                 key={item.title}
//                 item={item}
//                 hasNotification={
//                   (item.title === "Reports" && hasUnreadReports) ||
//                   (item.title === "Location" && hasIdleBuses)
//                 }
//               />
//             ))}
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// };

// export default Sidebar;


"use client";

import { useEffect, useState } from "react";
import MenuLink from "./menuLink/menuLink";
import styles from "./sidebar.module.css";
import { FaHistory, FaTimes } from "react-icons/fa";
import { IoBusOutline } from "react-icons/io5";
import { TbBusStop } from "react-icons/tb";
import {
  MdDashboard,
  MdPerson,
  MdRoute,
  MdReportGmailerrorred,
  MdOutlinePolicy,
} from "react-icons/md";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
} from "firebase/firestore";
import { db } from "../../../lib/firebaseConfig";
import Image from "next/image";

const menuItems = [
  {
    title: "   PAGES",
    list: [
      {
        title: "Dashboard",
        path: "/dashboard",
        icon: <MdDashboard className={styles.icon} />,
      },
      {
        title: "Drivers",
        path: "/dashboard/drivers",
        icon: <MdPerson className={styles.icon} />,
      },
      {
        title: "Routes",
        path: "/dashboard/route",
        icon: <MdRoute className={styles.icon} />,
      },
      {
        title: "Stops",
        path: "/dashboard/stops",
        icon: <TbBusStop className={styles.icon} />,
      },
      {
        title: "Location",
        path: "/dashboard/location",
        icon: <IoBusOutline className={styles.icon} />,
      },
      {
        title: "History",
        path: "/dashboard/history",
        icon: <FaHistory className={styles.icon} />,
      },
      {
        title: "Reports",
        path: "/dashboard/report",
        icon: <MdReportGmailerrorred className={styles.icon} />,
      },
    ],
  },
  {
    title: "   USER",
    list: [
      {
        title: "Term of Use",
        path: "/dashboard/terms",
        icon: <MdOutlinePolicy className={styles.icon} />,
      },
    ],
  },
];

const Sidebar = ({ isSidebarOpen, toggleSidebar }) => {
  const [logoUrl, setLogoUrl] = useState("");
  const [hasUnreadReports, setHasUnreadReports] = useState(false);
  const [hasIdleBuses, setHasIdleBuses] = useState(false);

  const isAtCityCollege = (location) => {
    const targetLat = 15.06137;
    const targetLng = 120.643928;
    const threshold = 0.0002;
    if (!location) return false;
    const latDiff = Math.abs(location.latitude - targetLat);
    const lngDiff = Math.abs(location.longitude - targetLng);
    return latDiff < threshold && lngDiff < threshold;
  };

  useEffect(() => {
    const cachedUrl = localStorage.getItem("sakeLogo");
    if (cachedUrl) {
      setLogoUrl(cachedUrl);
    } else {
      const fetchLogo = async () => {
        try {
          const storage = getStorage();
          const logoRef = ref(storage, "Logo/sake.png");
          const url = await getDownloadURL(logoRef);
          setLogoUrl(url);
          localStorage.setItem("sakeLogo", url);
        } catch (error) {
          console.error("Error fetching sake logo:", error);
        }
      };
      fetchLogo();
    }
  }, []);

  useEffect(() => {
    const companyID = localStorage.getItem("companyID");
    if (!companyID) return;

    const reportQuery = query(
      collection(db, "busReports"),
      where("companyID", "==", companyID)
    );

    let unsubMessageListeners = [];

    const unsubReports = onSnapshot(reportQuery, (snapshot) => {
      unsubMessageListeners.forEach((unsub) => unsub()); // Clean previous
      unsubMessageListeners = [];

      let reportsStatus = {};

      snapshot.docs.forEach((docSnap) => {
        const reportID = docSnap.id;
        const reportData = docSnap.data();

        const messagesRef = collection(db, "busReports", reportID, "messages");

        const unsubMsg = onSnapshot(messagesRef, (msgSnap) => {
          const messages = msgSnap.docs.map((d) => d.data());
          const hasMessages = messages.length > 0;
          const hasUnreadAdmin = messages.some(
            (msg) => msg.senderRole === "admin" && msg.seen === false
          );

          const isNewUnread = !hasMessages && !reportData.operatorSeen;

          reportsStatus[reportID] = hasUnreadAdmin || isNewUnread;

          const hasAnyUnread = Object.values(reportsStatus).some((v) => v === true);
          setHasUnreadReports(hasAnyUnread);
        });

        unsubMessageListeners.push(unsubMsg);
      });
    });

    const checkIdleBuses = async (snapshotDocs) => {
      const driversSnapshot = await getDocs(collection(db, "Drivers"));
      const driversMap = {};
      driversSnapshot.forEach((doc) => {
        const data = doc.data();
        driversMap[data.driverID] = data;
      });

      const now = new Date();
      const idleBuses = snapshotDocs.filter((doc) => {
        const data = doc.data();
        const driver = driversMap[data.driverID];
        const isSameCompany = driver?.companyID === companyID;
        const isActive = driver?.status === "active";
        const lastUpdate = data.lastUpdated?.toDate?.();
        const location = data.currentLocation;

        if (!lastUpdate || !isSameCompany || !isActive) return false;

        const diffMin = (now - lastUpdate) / 60000;

        if (isAtCityCollege(location)) {
          return diffMin >= 10;
        }

        return diffMin >= 3;
      });

      setHasIdleBuses(idleBuses.length > 0);
    };

    // Initial check
    getDocs(collection(db, "BusLocation")).then((snap) => checkIdleBuses(snap.docs));

    // Real-time updates
    const unsubIdle = onSnapshot(collection(db, "BusLocation"), (snapshot) => {
      checkIdleBuses(snapshot.docs);
    });

    return () => {
      unsubReports();
      unsubIdle();
      unsubMessageListeners.forEach((u) => u());
    };
  }, []);

  return (
    <div className={`${styles.container} ${isSidebarOpen ? styles.open : styles.closed}`}>
      <div className={styles.header}>
        <Image
          src={logoUrl || "/Logo.png"}
          alt="SAKE Logo"
          width={150}
          height={60}
          className={styles.logo}
          loading="lazy"
        />
        <button className={styles.closeButton} onClick={toggleSidebar}>
          <FaTimes />
        </button>
      </div>

      <ul className={styles.list}>
        {menuItems.map((cat) => (
          <li key={cat.title}>
            <span className={styles.cat}>{cat.title}</span>
            {cat.list.map((item) => (
              <MenuLink
                key={item.title}
                item={item}
                hasNotification={
                  (item.title === "Reports" && hasUnreadReports) ||
                  (item.title === "Location" && hasIdleBuses)
                }
              />
            ))}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
