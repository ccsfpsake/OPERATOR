"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./navbar.module.css";

const Navbar = () => {
  const [pathSegments, setPathSegments] = useState([]);
  const pathname = usePathname();

  useEffect(() => {
    if (pathname) {
      let segments = pathname.split("/").filter((segment) => segment);

      if (segments[0] === "dashboard") {
        segments.shift();
      }

      setPathSegments(segments);
    }
  }, [pathname]);


  if (pathname === "/dashboard") {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.title}>
        <h4>
          {pathSegments.length > 0
            ? pathSegments[pathSegments.length - 1].charAt(0).toUpperCase() +
              pathSegments[pathSegments.length - 1].slice(1)
            : "Dashboard"}
        </h4>
      </div>
      <nav aria-label="breadcrumb" role="navigation">
        <ol className={styles.breadcrumb}>
          <li className={styles.breadcrumbItem}>
            <Link href="/dashboard">Dashboard</Link>
          </li>
          {pathSegments.map((segment, index) => {
            const formattedSegment =
              segment.charAt(0).toUpperCase() + segment.slice(1);

            const shouldLink = index === 0;

            return (
              <li
                key={index}
                className={`${styles.breadcrumbItem} ${
                  index === pathSegments.length - 1 ? styles.active : ""
                }`}
                aria-current={
                  index === pathSegments.length - 1 ? "page" : undefined
                }
              >
                {shouldLink ? (
                  <Link href={`/dashboard/${segment}`}>{formattedSegment}</Link>
                ) : (
                  formattedSegment
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
};

export default Navbar;
