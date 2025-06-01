export const STORAGE_KEYS = {
  SEARCH_HISTORY: "searchHistory",
} as const;

export const MAX_HISTORY_ITEMS = 10;

export const COLORS = {
  PRIMARY: "#6366f1",
  SECONDARY: "#8b5cf6",
  BACKGROUND: "#f8fafc",
  SURFACE: "#ffffff",
  TEXT_PRIMARY: "#1e293b",
  TEXT_SECONDARY: "#64748b",
  BORDER: "#e2e8f0",
  SHADOW: "rgba(0, 0, 0, 0.1)",
} as const;


export const API_URL = import.meta.env.PROD 
  ? "/api" 
  : (import.meta.env.VITE_API_URL || "http://server:8000/api");

// API эндпоинты
export const API_ENDPOINTS = {
  SEARCH: {
    HISTORY: `${API_URL}/search/history/`,
    CREATE: `${API_URL}/search/`,
    DELETE: (id: number) => `${API_URL}/search/${id}/`,
    VALIDATE: `${API_URL}/search/validate_query/`,
  },
  PRODUCTS: {
    RESULTS: `${API_URL}/products/result/`,
  },
} as const;
