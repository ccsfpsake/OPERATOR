"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../lib/firebaseConfig";
import dayjs from "dayjs";
import { FiCalendar } from "react-icons/fi";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import styles from "./UserGrowth.module.css";

export default function UserGrowth() {
  const [userData, setUserData] = useState([]);
  const [grouping, setGrouping] = useState("monthly");
  const [chartType, setChartType] = useState("bar");
  const [loading, setLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [year, setYear] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const snapshot = await getDocs(collection(db, "users"));

      const grouped = {};
      let total = 0;
      let currentYear = "";

      const allMonths = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
      ];

      if (grouping === "monthly") {
        allMonths.forEach((month) => {
          grouped[month] = 0;
        });
      }

      snapshot.forEach((doc) => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate
          ? dayjs(data.createdAt.toDate())
          : null;
        if (!createdAt) return;

        const key = grouping === "monthly"
          ? createdAt.format("MMM")
          : createdAt.format("YYYY");

        if (grouping === "monthly") {
          currentYear = createdAt.format("YYYY");
        }

        grouped[key] = (grouped[key] || 0) + 1;
        total++;
      });

      const formatted =
        grouping === "monthly"
          ? allMonths.map((month) => ({
              period: month,
              users: grouped[month] || 0,
            }))
          : Object.entries(grouped)
              .sort((a, b) => parseInt(a[0], 10) - parseInt(b[0], 10))
              .map(([key, value]) => ({
                period: key,
                users: value,
              }));

      setUserData(formatted);
      setTotalUsers(total);
      setYear(currentYear);
      setLoading(false);
    };

    fetchData();
  }, [grouping]);

  const renderChart = () => {
    const commonProps = {
      data: userData,
      margin: { top: 10, right: 20, left: 10, bottom: 10 },
    };

    const axisStyle = {
      tick: { fontSize: 12, fill: "#444" },
      axisLine: { stroke: "#ccc" },
    };

    const tooltipStyle = {
      contentStyle: {
        backgroundColor: "#fff",
        borderRadius: 8,
        borderColor: "#0070f3",
      },
      labelStyle: {
        fontWeight: "bold",
        color: "#0070f3",
      },
    };

    return chartType === "bar" ? (
      <BarChart {...commonProps}>
        <CartesianGrid stroke="#e0e0e0" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="period" {...axisStyle} />
        <YAxis allowDecimals={false} {...axisStyle} />
        <Tooltip {...tooltipStyle} />
        <Bar dataKey="users" fill="#0070f3" radius={[4, 4, 0, 0]} />
      </BarChart>
    ) : (
      <LineChart {...commonProps}>
        <CartesianGrid stroke="#e0e0e0" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="period" {...axisStyle} />
        <YAxis allowDecimals={false} {...axisStyle} />
        <Tooltip {...tooltipStyle} />
        <Line
          type="monotone"
          dataKey="users"
          stroke="#0070f3"
          strokeWidth={2}
          dot={{
            r: 4,
            strokeWidth: 1.5,
            fill: "#fff",
            stroke: "#0070f3",
          }}
        />
      </LineChart>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.top}>
        <h3 className={styles.title}>Commuters Graph</h3>

        <div className={styles.controls}>
          <div className={styles.selectGroup}>
            <select value={grouping} onChange={(e) => setGrouping(e.target.value)}>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div className={styles.selectGroup}>
            <select value={chartType} onChange={(e) => setChartType(e.target.value)}>
              <option value="bar">Bar Chart</option>
              <option value="line">Line Chart</option>
            </select>
          </div>
        </div>
      </div>

      {grouping === "monthly" && year && (
        <h4 className={styles.yearLabel}>
          <FiCalendar className={styles.icon} /> Year: {year}
        </h4>
      )}

      {loading ? (
        <p className={styles.loading}>Loading...</p>
      ) : userData.length === 0 ? (
        <p className={styles.noData}>No Commuters data available for this view.</p>
      ) : (
        <div className={styles.chartWrapper}>
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
