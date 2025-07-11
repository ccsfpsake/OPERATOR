"use client";

import React, { memo } from "react";
import Link from "next/link";
import styles from "./menuLink.module.css";
import { usePathname } from "next/navigation";

const MenuLink = memo(({ item, hasNotification }) => {
  const pathname = usePathname();

  return (
    <Link
      href={item.path}
      className={`${styles.container} ${pathname === item.path ? styles.active : ""}`}
    >
      <div className={styles.iconTextWrapper}>
        <div className={styles.icon}>{item.icon}</div>
        <span className={styles.title}>{item.title}</span>
      </div>
      {hasNotification && <span className={styles.notificationDot} />}
    </Link>
  );
});

MenuLink.displayName = "MenuLink"; 

export default MenuLink;
