/**
 * Real-time Cloud API Client & Configuration
 * Provides seamless multi-device cloud synchronization with automatic fallback.
 */

export const CLOUD_BACKEND_URL = 'https://rental-management-system-yjfg.onrender.com/api';

export function getBaseApiUrl() {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
    return envUrl.replace(/\/$/, '');
  }
  
  if (typeof window !== 'undefined') {
    // If on localhost / 127.0.0.1 in dev mode, try local proxy first
    if (import.meta.env.DEV) {
      return '/api';
    }
    // In production (Vercel, custom domain), use cloud backend URL
    return CLOUD_BACKEND_URL;
  }
  
  return CLOUD_BACKEND_URL;
}

/**
 * Robust cloud fetch with automatic fallback between local dev proxy and live cloud backend
 */
export async function apiFetch(endpoint, options = {}) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const base = getBaseApiUrl();
  const primaryUrl = `${base}${cleanEndpoint}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(primaryUrl, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      signal: options.signal || controller.signal
    });
    clearTimeout(timeout);

    // If local dev server returned 502/503/504 Bad Gateway (backend not running locally),
    // automatically fall back to live Render Cloud backend!
    if (!res.ok && (res.status === 502 || res.status === 503 || res.status === 504) && primaryUrl.startsWith('/api')) {
      console.warn('⚡ Local API proxy returned gateway error, falling back to Cloud backend:', CLOUD_BACKEND_URL);
      const fallbackUrl = `${CLOUD_BACKEND_URL}${cleanEndpoint}`;
      return await fetch(fallbackUrl, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        }
      });
    }

    return res;
  } catch (err) {
    // If network error (e.g. connection refused on local dev server), fall back to Cloud backend
    if (primaryUrl.startsWith('/api') || primaryUrl.includes('localhost')) {
      console.warn('⚡ Local proxy unreachable, falling back to Cloud backend:', CLOUD_BACKEND_URL);
      const fallbackUrl = `${CLOUD_BACKEND_URL}${cleanEndpoint}`;
      return await fetch(fallbackUrl, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        }
      });
    }
    throw err;
  }
}
