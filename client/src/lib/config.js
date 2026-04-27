const DEFAULT_DEV_API_URL = "http://localhost:5000";
const DEFAULT_PROD_API_URL = "https://citrus-1-1g0z.onrender.com";

export function getApiBaseUrl() {
  const fromEnv = import.meta.env.VITE_API_BASE_URL;
  if (fromEnv && String(fromEnv).trim()) {
    return String(fromEnv).trim();
  }

  if (import.meta.env.PROD) {
    return DEFAULT_PROD_API_URL;
  }

  return DEFAULT_DEV_API_URL;
}

