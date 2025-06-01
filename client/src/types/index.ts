export interface SearchItem {
  id: string;
  query: string;
  timestamp: Date;
}

export interface ApiSearchHistoryItem {
  id: number;
  query_text: string;
  created_at: string;
  is_completed: boolean;
  total_results: number;
}

export interface SearchState {
  currentQuery: string;
  searchHistory: ApiSearchHistoryItem[];
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasMore: boolean;
  errorMessage: string | null;
  validationState: {
    isValidating: boolean;
    isValidated: boolean;
    totalResults: number | null;
  };
}

export interface ProductItem {
  id: number;
  external_id: number;
  name: string;
  brand: string;
  supplier: string;
  supplier_rating: number;
  review_rating: number;
  feedbacks: number;
  price: number;
  created_at: string;
  search_query: number;
}

export interface ProductsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  current_page: number;
  total_pages: number;
  results: ProductItem[];
  search_query: {
    id: number;
    query_text: string;
    is_completed: boolean;
    total_results: number;
    created_at: string;
    filters?: Record<string, string>;
  };
} 