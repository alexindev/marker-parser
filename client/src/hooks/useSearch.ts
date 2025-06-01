import { useState, useCallback, useRef } from "react";
import type { SearchState } from "@/types";
import { ApiService } from "@/services/apiService";

export const useSearch = () => {
  const [searchState, setSearchState] = useState<SearchState>({
    currentQuery: "",
    searchHistory: [],
    isLoading: false,
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasMore: false,
    errorMessage: null,
    validationState: {
      isValidating: false,
      isValidated: false,
      totalResults: null
    }
  });

  // Используем ref для предотвращения лишних вызовов
  const fetchInProgress = useRef(false);

  const fetchHistory = useCallback(async (page?: number, force = false) => {
    // Если запрос уже в процессе и это не принудительное обновление, то выходим
    if (fetchInProgress.current && !force) return;
    
    // Используем переданную страницу или текущую из состояния
    const pageToFetch = page || searchState.currentPage;
    
    try {
      fetchInProgress.current = true;
      setSearchState((prev) => ({ ...prev, isLoading: true, errorMessage: null }));
      const response = await ApiService.getSearchHistory(pageToFetch);

      setSearchState((prev) => ({
        ...prev,
        searchHistory: response.results,
        currentPage: response.current_page,
        totalPages: response.total_pages,
        totalCount: response.count,
        hasMore: !!response.next,
        isLoading: false,
      }));
    } catch (error) {
      console.error("Error fetching history:", error);
      setSearchState((prev) => ({ 
        ...prev, 
        isLoading: false,
        errorMessage: "Ошибка при загрузке истории поиска"
      }));
    } finally {
      fetchInProgress.current = false;
    }
  }, []);

  const changePage = useCallback((page: number) => {
    if (page < 1 || page > searchState.totalPages) return;
    
    // Только если страница изменилась, запрашиваем новые данные
    if (page !== searchState.currentPage) {
      fetchHistory(page, true);
    }
  }, [searchState.currentPage, searchState.totalPages, fetchHistory]);

  const updateQuery = useCallback((query: string) => {
    setSearchState((prev) => ({ 
      ...prev, 
      currentQuery: query, 
      errorMessage: null,
      validationState: {
        isValidating: false,
        isValidated: false,
        totalResults: null
      }
    }));
  }, []);

  const validateQuery = useCallback(async (query?: string) => {
    const searchQuery = query || searchState.currentQuery;
    if (!searchQuery.trim()) return;

    // Скрываем предыдущие результаты валидации при повторном запросе
    setSearchState((prev) => ({ 
      ...prev, 
      isLoading: true, 
      errorMessage: null,
      validationState: {
        isValidating: true,
        isValidated: false,
        totalResults: null
      }
    }));

    try {
      const result = await ApiService.validateQuery(searchQuery);
      
      setSearchState((prev) => ({ 
        ...prev, 
        isLoading: false,
        validationState: {
          isValidating: false,
          isValidated: true,
          totalResults: result.total
        }
      }));
    } catch (error) {
      console.error("Error validating query:", error);
      // Извлекаем текст ошибки
      const errorMessage = error instanceof Error ? error.message : "Ошибка при валидации поискового запроса";
      
      setSearchState((prev) => ({ 
        ...prev, 
        isLoading: false,
        errorMessage: errorMessage,
        validationState: {
          isValidating: false,
          isValidated: false,
          totalResults: null
        }
      }));
    }
  }, [searchState.currentQuery]);

  const performSearch = useCallback(
    async (query?: string) => {
      const searchQuery = query || searchState.currentQuery;
      if (!searchQuery.trim()) return;

      setSearchState((prev) => ({ 
        ...prev, 
        isLoading: true, 
        errorMessage: null,
        validationState: {
          ...prev.validationState,
          isValidated: false
        }
      }));

      try {
        const result = await ApiService.search(searchQuery);
        
        if (result.success) {
          // После успешного поиска обновляем историю принудительно
          // Возвращаемся на первую страницу
          fetchHistory(1, true);
        } else {
          // Отображаем сообщение об ошибке
          setSearchState((prev) => ({ 
            ...prev, 
            isLoading: false,
            errorMessage: result.error || "Произошла ошибка при выполнении поиска"
          }));
        }
      } catch (error) {
        console.error("Error performing search:", error);
        // Извлекаем текст ошибки
        const errorMessage = error instanceof Error ? error.message : "Произошла ошибка при выполнении поиска";
        
        setSearchState((prev) => ({ 
          ...prev, 
          isLoading: false,
          errorMessage: errorMessage
        }));
      }
    },
    [searchState.currentQuery, fetchHistory]
  );

  const cancelValidation = useCallback(() => {
    setSearchState((prev) => ({ 
      ...prev, 
      validationState: {
        isValidating: false,
        isValidated: false,
        totalResults: null
      }
    }));
  }, []);

  const deleteHistoryItem = useCallback(
    async (id: number) => {
      try {
        setSearchState((prev) => ({ ...prev, isLoading: true, errorMessage: null }));
        await ApiService.deleteSearchHistoryItem(id);
        
        // После успешного удаления проверяем необходимость перехода на предыдущую страницу
        // Если это последний элемент на странице и не первая страница
        if (searchState.searchHistory.length === 1 && searchState.currentPage > 1) {
          // Переходим на предыдущую страницу
          fetchHistory(searchState.currentPage - 1, true);
        } else {
          // Иначе обновляем текущую страницу
          fetchHistory(searchState.currentPage, true);
        }
      } catch (error) {
        console.error("Error deleting history item:", error);
        // Извлекаем текст ошибки
        const errorMessage = error instanceof Error ? error.message : "Ошибка при удалении элемента истории";
        
        setSearchState((prev) => ({ 
          ...prev, 
          isLoading: false,
          errorMessage: errorMessage
        }));
      }
    },
    [fetchHistory, searchState.currentPage, searchState.searchHistory.length]
  );

  const clearError = useCallback(() => {
    setSearchState(prev => ({ ...prev, errorMessage: null }));
  }, []);

  return {
    searchState,
    updateQuery,
    validateQuery,
    performSearch,
    cancelValidation,
    fetchHistory,
    deleteHistoryItem,
    clearError,
    changePage
  };
};
