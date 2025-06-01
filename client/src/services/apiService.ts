import { API_ENDPOINTS } from "@constants/index";
import { ProductsResponse } from "@/types";
import { Filters } from "@hooks/useSearchResults";

export interface SearchHistoryItem {
  id: number;
  query_text: string;
  created_at: string;
  is_completed: boolean;
  total_results: number;
}

export interface SearchHistoryResponse {
  count: number;
  next: string | null;
  previous: string | null;
  current_page: number;
  total_pages: number;
  results: SearchHistoryItem[];
}

export interface ApiError {
  error: string;
}

export interface ValidateQueryResponse {
  total: number;
}

export class ApiService {
  static async getSearchHistory(page = 1): Promise<SearchHistoryResponse> {
    try {
      const response = await fetch(
        `${API_ENDPOINTS.SEARCH.HISTORY}?page=${page}`
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching search history:", error);
      // Возвращаем пустой список в случае ошибки
      return {
        count: 0,
        next: null,
        previous: null,
        current_page: 1,
        total_pages: 1,
        results: [],
      };
    }
  }

  static async search(
    query: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(API_ENDPOINTS.SEARCH.CREATE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query_text: query }),
      });

      if (response.status === 409) {
        // Обрабатываем конфликт (уже существующий запрос)
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.error || "Запрос уже существует в истории",
        };
      }

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      return { success: true };
    } catch (error) {
      console.error("Error performing search:", error);
      return {
        success: false,
        error: "Произошла ошибка при выполнении поиска",
      };
    }
  }

  static async deleteSearchHistoryItem(id: number): Promise<void> {
    try {
      const response = await fetch(API_ENDPOINTS.SEARCH.DELETE(id), {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.status}`);
      }
    } catch (error) {
      console.error("Error deleting search history item:", error);
      throw error;
    }
  }

  static async validateQuery(query: string): Promise<ValidateQueryResponse> {
    try {
      const response = await fetch(API_ENDPOINTS.SEARCH.VALIDATE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: query }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error validating query:", error);
      throw error;
    }
  }

  static async getSearchResults(
    queryId: number,
    page = 1,
    filters?: Filters
  ): Promise<ProductsResponse> {
    try {
      // Создаем базовый URL с параметрами запроса
      let url = `${API_ENDPOINTS.PRODUCTS.RESULTS}?id=${queryId}&page=${page}`;

      // Добавляем параметры фильтров, если они указаны
      if (filters) {
        // Для текстовых полей
        if (filters.name) url += `&name_sort=${filters.name}`;
        if (filters.brand) url += `&brand_sort=${filters.brand}`;
        if (filters.supplier) url += `&supplier_sort=${filters.supplier}`;

        // Для числовых полей
        if (filters.supplierRating)
          url += `&supplier_rating_sort=${filters.supplierRating}`;
        if (filters.reviewRating)
          url += `&review_rating_sort=${filters.reviewRating}`;
        if (filters.feedbacks) url += `&feedbacks_sort=${filters.feedbacks}`;
        if (filters.price) url += `&price_sort=${filters.price}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching search results:", error);
      throw error;
    }
  }
}
