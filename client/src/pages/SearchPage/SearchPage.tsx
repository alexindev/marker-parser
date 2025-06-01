import React, { useEffect } from "react";
import {
  SearchInput,
  SearchHistory,
  ErrorMessage,
  Pagination,
} from "@/components";
import { useSearch } from "@/hooks/useSearch";
import s from "./s.module.scss";

export const SearchPage: React.FC = () => {
  const {
    searchState,
    updateQuery,
    validateQuery,
    performSearch,
    cancelValidation,
    fetchHistory,
    deleteHistoryItem,
    clearError,
    changePage,
  } = useSearch();

  // Загружаем историю при монтировании компонента
  useEffect(() => {
    const controller = new AbortController();
    const fetchInitialHistory = async () => {
      try {
        await fetchHistory(1);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Failed to load initial history:", error);
        }
      }
    };
    
    fetchInitialHistory();
    
    return () => {
      controller.abort();
    };
  }, []);

  return (
    <div className={s.pageContainer}>
      <div className={s.mainContent}>
        <div className={s.searchSection}>
          <h1 className={s.title}>Поиск</h1>
          <SearchInput
            currentQuery={searchState.currentQuery}
            onUpdateQuery={updateQuery}
            onSearch={performSearch}
            onValidate={validateQuery}
            onCancelValidation={cancelValidation}
            isLoading={searchState.isLoading}
            validationState={searchState.validationState}
          />

          {searchState.errorMessage && (
            <ErrorMessage
              error={searchState.errorMessage}
              onClose={clearError}
            />
          )}
        </div>

        <SearchHistory
          history={searchState.searchHistory}
          isLoading={searchState.isLoading}
          onSelect={updateQuery}
          onRemove={deleteHistoryItem}
          onRefresh={() => fetchHistory(searchState.currentPage, true)}
        />

        {searchState.totalPages > 1 && (
          <Pagination
            currentPage={searchState.currentPage}
            totalPages={searchState.totalPages}
            onPageChange={changePage}
          />
        )}
      </div>
    </div>
  );
};
