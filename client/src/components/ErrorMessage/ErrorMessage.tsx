import React from "react";
import styles from "./s.module.scss";

interface ErrorMessageProps {
  error: string;
  onClose: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ error, onClose }) => {
  return (
    <div className={styles.errorContainer}>
      <div className={styles.errorContent}>
        <span className={styles.errorText}>{error}</span>
        <button onClick={onClose} className={styles.closeButton}>
          ✕
        </button>
      </div>
    </div>
  );
}; 