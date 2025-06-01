import React from "react";
import { useNavigate } from "react-router-dom";
import type { ApiSearchHistoryItem } from "@/types";
import s from "./s.module.scss";

interface SearchHistoryProps {
  history: ApiSearchHistoryItem[];
  isLoading: boolean;
  onSelect: (query: string) => void;
  onRemove: (id: number) => void;
  onRefresh: () => void;
}

export const SearchHistory: React.FC<SearchHistoryProps> = ({
  history,
  isLoading,
  onSelect,
  onRemove,
  onRefresh,
}) => {
  const navigate = useNavigate();
  
  const getStatusText = (item: ApiSearchHistoryItem) => {
    if (!item.is_completed) {
      return "Собираем данные";
    }
    return "Готово";
  };

  const getStatusClassName = (item: ApiSearchHistoryItem) => {
    return item.is_completed ? s.statusCompleted : s.statusProcessing;
  };
  
  const handleViewResults = (item: ApiSearchHistoryItem) => {
    navigate(`/results/${item.id}`);
  };

  if (history.length === 0 && !isLoading) {
    return (
      <div className={s.historyContainer}>
        <div className={s.historyHeader}>
          <h3 className={s.historyTitle}>История поиска</h3>
          <button onClick={onRefresh} className={s.clearButton}>
            Обновить
          </button>
        </div>
        <div className={s.emptyState}>История поиска пуста</div>
      </div>
    );
  }

  return (
    <div className={s.historyContainer}>
      <div className={s.historyHeader}>
        <h3 className={s.historyTitle}>История поиска</h3>
        <button onClick={onRefresh} className={s.clearButton}>
          Обновить
        </button>
      </div>

      {isLoading ? (
        <div className={s.loadingState}>Загрузка...</div>
      ) : (
        <div className={s.historyList}>
          {history.map((item) => (
            <div key={item.created_at} className={s.historyItem}>
              <button
                onClick={() => onSelect(item.query_text)}
                className={s.queryButton}
              >
                <span className={s.queryText}>{item.query_text}</span>
                <div className={s.itemDetails}>
                  <span className={s.timestamp}>
                    {new Date(item.created_at).toLocaleString()}
                  </span>
                  <span className={`${s.status} ${getStatusClassName(item)}`}>
                    {getStatusText(item)}
                  </span>
                </div>
              </button>
              <button
                onClick={() => handleViewResults(item)}
                className={`${s.removeButton} ${s.searchButton}`}
                disabled={!item.is_completed}
                title={!item.is_completed ? "Данные еще собираются" : "Просмотреть результаты"}
              >
                Просмотр
              </button>
              <button
                onClick={() => onRemove(item.id)}
                className={s.removeButton}
              >
                Удалить
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
