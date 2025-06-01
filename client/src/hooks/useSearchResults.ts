import { useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ApiService } from '@/services/apiService';
import { ProductItem } from '@/types';

// Типы фильтров
export type SortDirection = 'asc' | 'desc';

export interface Filters {
  name?: string;
  brand?: string;
  supplier?: string;
  supplierRating?: SortDirection;
  reviewRating?: SortDirection;
  feedbacks?: SortDirection;
  price?: SortDirection;
}

interface SearchResultsState {
  products: ProductItem[];
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  errorMessage: string | null;
  queryInfo: {
    id: number;
    queryText: string;
    isCompleted: boolean;
    totalResults: number;
    createdAt: string;
  } | null;
  filters: Filters;
}

export const useSearchResults = (queryId: number) => {
  // Ref для предотвращения дублирующихся запросов
  const isInitialMount = useRef(true);
  // Ref для отслеживания выполняющегося запроса
  const isRequestInProgress = useRef(false);
  
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Получаем фильтры из URL при инициализации
  const initialFilters: Filters = {
    name: searchParams.get('name') || undefined,
    brand: searchParams.get('brand') || undefined,
    supplier: searchParams.get('supplier') || undefined,
    supplierRating: (searchParams.get('supplierRating') as SortDirection) || undefined,
    reviewRating: (searchParams.get('reviewRating') as SortDirection) || undefined,
    feedbacks: (searchParams.get('feedbacks') as SortDirection) || undefined,
    price: (searchParams.get('price') as SortDirection) || undefined,
  };

  const [state, setState] = useState<SearchResultsState>({
    products: [],
    isLoading: false,
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    errorMessage: null,
    queryInfo: null,
    filters: initialFilters
  });

  const fetchResults = useCallback(async (page: number = 1, filters?: Filters) => {
    // Проверяем, не выполняется ли уже запрос
    if (isRequestInProgress.current) {
      return;
    }
    
    // Устанавливаем флаг, что запрос начался
    isRequestInProgress.current = true;
    
    setState(prev => ({ ...prev, isLoading: true, errorMessage: null }));
    
    try {
      // Используем фильтры, переданные в функцию или текущие фильтры из состояния
      const filtersToUse = filters || state.filters;
      
      // Отправляем запрос с фильтрами на бекенд
      const response = await ApiService.getSearchResults(queryId, page, filtersToUse);
      
      setState(prev => ({
        ...prev,
        products: response.results,
        isLoading: false,
        currentPage: response.current_page,
        totalPages: response.total_pages,
        totalCount: response.count,
        errorMessage: null,
        filters: filters || prev.filters, // Обновляем фильтры в состоянии
        queryInfo: {
          id: response.search_query.id,
          queryText: response.search_query.query_text,
          isCompleted: response.search_query.is_completed,
          totalResults: response.search_query.total_results,
          createdAt: response.search_query.created_at
        }
      }));
      
    } catch (error) {
      console.error('Error fetching search results:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        errorMessage: error instanceof Error ? error.message : 'Ошибка при загрузке результатов'
      }));
    } finally {
      // Сбрасываем флаг, что запрос завершен
      isRequestInProgress.current = false;
    }
  }, [queryId, state.filters]);

  const changePage = useCallback((page: number) => {
    if (page < 1 || page > state.totalPages) return;
    if (page !== state.currentPage) {
      fetchResults(page, state.filters);
    }
  }, [state.currentPage, state.totalPages, state.filters, fetchResults]);

  // Обновление одного фильтра и отправка запроса с новыми фильтрами
  const updateSingleFilter = useCallback((field: keyof Filters, direction: SortDirection | undefined) => {
    // Создаем копию текущих фильтров
    const newFilters = { ...state.filters };
    
    if (direction === undefined) {
      // Удаляем фильтр, если направление не задано
      delete newFilters[field];
    } else {
      // Иначе устанавливаем новое направление
      newFilters[field] = direction;
    }
    
    // Обновляем URL параметры без вызова эффекта
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.set(key, value);
      }
    });
    setSearchParams(params, { replace: true });
    
    // Отправляем запрос с новыми фильтрами
    fetchResults(1, newFilters);
    
  }, [state.filters, setSearchParams, fetchResults]);

  // Полное обновление всех фильтров и отправка запроса
  const updateFilters = useCallback((newFilters: Filters) => {
    // Обновляем URL параметры без вызова эффекта
    const params = new URLSearchParams();
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.set(key, value);
      }
    });
    
    setSearchParams(params, { replace: true });
    
    // Отправляем запрос с новыми фильтрами
    fetchResults(1, newFilters);
    
  }, [setSearchParams, fetchResults]);

  // Единственный эффект для загрузки данных при монтировании
  useEffect(() => {
    if (isInitialMount.current) {
      // Получаем фильтры из URL
      const urlFilters: Filters = {
        name: searchParams.get('name') || undefined,
        brand: searchParams.get('brand') || undefined,
        supplier: searchParams.get('supplier') || undefined,
        supplierRating: (searchParams.get('supplierRating') as SortDirection) || undefined,
        reviewRating: (searchParams.get('reviewRating') as SortDirection) || undefined,
        feedbacks: (searchParams.get('feedbacks') as SortDirection) || undefined,
        price: (searchParams.get('price') as SortDirection) || undefined,
      };
      
      // Загружаем данные
      fetchResults(1, urlFilters);
      
      // Помечаем, что первичная загрузка выполнена
      isInitialMount.current = false;
    }
  }, [fetchResults, queryId, searchParams]);

  return {
    resultsState: state,
    changePage,
    updateSingleFilter,
    updateFilters
  };
}; 