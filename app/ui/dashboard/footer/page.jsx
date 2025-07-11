import styles from "./footer.module.css";

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <p>© {new Date().getFullYear()} SAKE. All Rights Reserved.</p>
    </footer>
  );
};

export default Footer;
