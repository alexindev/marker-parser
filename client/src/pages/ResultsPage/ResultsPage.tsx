import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useSearchResults,
  Filters,
  SortDirection,
} from "@/hooks/useSearchResults";
import { ProductsTable } from "@/components/ProductsTable";
import { Pagination, ErrorMessage } from "@/components";
import s from "./s.module.scss";

export const ResultsPage: React.FC = () => {
  const { queryId } = useParams<{ queryId: string }>();
  const navigate = useNavigate();

  const { resultsState, changePage, updateSingleFilter } = useSearchResults(
    parseInt(queryId || "0", 10)
  );

  const handleBackClick = () => {
    navigate("/");
  };

  const handleSortChange = (
    field: keyof Filters,
    direction: SortDirection | undefined
  ) => {
    updateSingleFilter(field, direction);
  };

  return (
    <div className={s.pageContainer}>
      <div className={s.mainContent}>
        <div className={s.header}>
          <button onClick={handleBackClick} className={s.backButton}>
            ← Назад к поиску
          </button>
        </div>

        <div className={s.resultsHeader}>
          <h1 className={s.title}>
            Результаты поиска: "{resultsState.queryInfo?.queryText || ""}"
          </h1>
          <div className={s.resultsInfo}>
            <div className={s.infoItem}>
              <span className={s.infoLabel}>Всего товаров:</span>
              <span className={s.infoValue}>{resultsState.totalCount}</span>
              <span className={s.infoLabel}> (первые 10 страниц)</span>
            </div>
          </div>
        </div>

        {resultsState.errorMessage && (
          <ErrorMessage error={resultsState.errorMessage} onClose={() => {}} />
        )}

        <ProductsTable
          products={resultsState.products}
          isLoading={resultsState.isLoading}
          filters={resultsState.filters}
          onSortChange={handleSortChange}
        />

        {resultsState.totalPages > 1 && (
          <Pagination
            currentPage={resultsState.currentPage}
            totalPages={resultsState.totalPages}
            onPageChange={changePage}
          />
        )}
      </div>
    </div>
  );
};
