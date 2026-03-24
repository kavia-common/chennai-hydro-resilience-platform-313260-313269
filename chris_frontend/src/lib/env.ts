type ViteEnv = ImportMetaEnv & {
  readonly REACT_APP_API_BASE?: string;
  readonly REACT_APP_BACKEND_URL?: string;
  readonly REACT_APP_FRONTEND_URL?: string;
  readonly REACT_APP_SITE_URL?: string;
  readonly REACT_APP_PUBLIC_URL?: string;
  readonly REACT_APP_SUPABASE_URL?: string;
  readonly REACT_APP_SUPABASE_KEY?: string;
};

function env(): ViteEnv {
  return import.meta.env as unknown as ViteEnv;
}

/**
 * PUBLIC_INTERFACE
 */
export function getApiBaseUrl(): string {
  /** Returns backend API base URL. */
  return (
    env().REACT_APP_API_BASE ||
    env().REACT_APP_BACKEND_URL ||
    "http://localhost:3001"
  );
}

/**
 * PUBLIC_INTERFACE
 */
export function getFrontendUrl(): string {
  /** Returns frontend URL for auth redirects (fallback: window origin). */
  return env().REACT_APP_SITE_URL || env().REACT_APP_FRONTEND_URL || window.location.origin;
}

/**
 * PUBLIC_INTERFACE
 */
export function getPublicBasePath(): string | undefined {
  /**
   * Returns router basename when app is hosted under a subpath.
   * Vite base uses a trailing slash; React Router basename should NOT.
   */
  const raw = env().REACT_APP_PUBLIC_URL;
  if (!raw) return undefined;
  const withLeading = raw.startsWith("/") ? raw : `/${raw}`;
  return withLeading.endsWith("/") ? withLeading.slice(0, -1) : withLeading;
}

/**
 * PUBLIC_INTERFACE
 */
export function getSupabaseConfig(): { url: string; anonKey: string } | null {
  /** Returns Supabase config or null if not configured. */
  const url = env().REACT_APP_SUPABASE_URL;
  const anonKey = env().REACT_APP_SUPABASE_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}
