import React from 'react';
import styles from './s.module.scss';

interface ValidationResultsProps {
  totalResults: number;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const ValidationResults: React.FC<ValidationResultsProps> = ({
  totalResults,
  onConfirm,
  onCancel,
  isLoading
}) => {
  return (
    <div className={styles.validationContainer}>
      <div className={styles.validationMessage}>
        {isLoading ? (
          <p className={styles.validatingText}>Проверка запроса...</p>
        ) : (
          <>
            <p className={styles.resultText}>
              По вашему запросу найдено <span className={styles.resultCount}>{totalResults}</span> совпадений
            </p>
            <div className={styles.actions}>
              <button 
                className={`${styles.actionButton} ${styles.confirmButton}`}
                onClick={onConfirm}
              >
                Получить данные
              </button>
              <button 
                className={`${styles.actionButton} ${styles.cancelButton}`}
                onClick={onCancel}
              >
                Отменить
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}; 