import styles from './search-page.module.css';

export function SearchPageFooter() {
  return (
    <div className={styles.footerLinks}>
      <a
        href="https://help.curseduca.com"
        target="_blank"
        rel="noopener noreferrer"
        className={styles.footerLink}
      >
        Help Center
      </a>
      <span className={styles.footerSeparator}>•</span>
      <a
        href="https://curseduca.com"
        target="_blank"
        rel="noopener noreferrer"
        className={styles.footerLink}
      >
        Curseduca
      </a>
    </div>
  );
} 