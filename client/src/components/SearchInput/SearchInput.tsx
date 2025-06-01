import React, { useCallback, FormEvent, ChangeEvent } from 'react';
import s from './s.module.scss';
import { ValidationResults } from '@/components/ValidationResults';

interface SearchInputProps {
  onSearch: (query: string) => void;
  onValidate: (query: string) => void;
  onUpdateQuery: (query: string) => void;
  onCancelValidation: () => void;
  currentQuery: string;
  isLoading: boolean;
  validationState: {
    isValidating: boolean;
    isValidated: boolean;
    totalResults: number | null;
  };
}

export const SearchInput: React.FC<SearchInputProps> = ({
  onSearch,
  onValidate,
  onUpdateQuery,
  onCancelValidation,
  currentQuery,
  isLoading,
  validationState
}) => {
  // Кнопка всегда отображает текст "Проверить"
  const buttonText = 'Проверить';

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      
      // Всегда вызываем только валидацию
      onValidate(currentQuery);
    },
    [currentQuery, onValidate]
  );

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onUpdateQuery(e.target.value);
    },
    [onUpdateQuery]
  );

  const showValidationResults = validationState.isValidating || validationState.isValidated;

  return (
    <>
      <form className={s.searchForm} onSubmit={handleSubmit}>
        <div className={s.inputWrapper}>
          <input
            type="text"
            className={s.searchInput}
            placeholder="Введите поисковый запрос..."
            value={currentQuery}
            onChange={handleChange}
            disabled={isLoading}
          />
          <button
            type="submit"
            className={s.searchButton}
            disabled={isLoading || !currentQuery.trim()}
          >
            {buttonText}
          </button>
        </div>
      </form>
      
      {showValidationResults && validationState.totalResults !== null && (
        <ValidationResults
          totalResults={validationState.totalResults}
          onConfirm={() => onSearch(currentQuery)}
          onCancel={onCancelValidation}
          isLoading={validationState.isValidating}
        />
      )}
    </>
  );
}; 