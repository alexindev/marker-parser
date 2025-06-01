import React from "react";
import styles from "./s.module.scss";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange
}) => {
  if (totalPages <= 1) {
    return null;
  }

  // Функция для создания массива номеров страниц
  const getPageNumbers = () => {
    const pageNumbers: number[] = [];
    const maxVisiblePages = 5; // Максимальное количество видимых страниц
    
    // Если страниц мало, показываем все
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
      return pageNumbers;
    }
    
    // Если текущая страница близка к началу
    if (currentPage <= 3) {
      for (let i = 1; i <= 4; i++) {
        pageNumbers.push(i);
      }
      pageNumbers.push(totalPages);
      return pageNumbers;
    }
    
    // Если текущая страница близка к концу
    if (currentPage >= totalPages - 2) {
      pageNumbers.push(1);
      for (let i = totalPages - 3; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
      return pageNumbers;
    }
    
    // В середине
    pageNumbers.push(1);
    for (let i = currentPage - 1; i <= currentPage + 1; i++) {
      pageNumbers.push(i);
    }
    pageNumbers.push(totalPages);
    return pageNumbers;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className={styles.pagination}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={styles.pageButton}
        aria-label="Предыдущая страница"
      >
        &#8592;
      </button>
      
      {pageNumbers.map((number, index) => {
        // Если между соседними элементами есть пропуск, добавляем многоточие
        if (index > 0 && number - pageNumbers[index - 1] > 1) {
          return (
            <React.Fragment key={`ellipsis-${number}`}>
              <span className={styles.ellipsis}>...</span>
              <button
                onClick={() => onPageChange(number)}
                className={`${styles.pageButton} ${currentPage === number ? styles.active : ''}`}
              >
                {number}
              </button>
            </React.Fragment>
          );
        }
        
        return (
          <button
            key={number}
            onClick={() => onPageChange(number)}
            className={`${styles.pageButton} ${currentPage === number ? styles.active : ''}`}
          >
            {number}
          </button>
        );
      })}
      
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={styles.pageButton}
        aria-label="Следующая страница"
      >
        &#8594;
      </button>
    </div>
  );
}; 