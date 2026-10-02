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
    // If on localhost / dev mode, use local proxy /api
    if (import.meta.env.DEV) {
      return '/api';
    }
    // In production, use live cloud backend URL
    return CLOUD_BACKEND_URL;
  }
  
  return CLOUD_BACKEND_URL;
}

/**
 * Robust cloud fetch with automatic fallback between local dev proxy and live cloud backend
 */
export async function apiFetch(endpoint, options = {}) {
  // Normalize endpoint so it works whether caller passes 'sync', '/sync', or '/api/sync'
  let raw = endpoint || '';
  if (!raw.startsWith('/')) raw = `/${raw}`;
  const pathOnly = raw.startsWith('/api/') 
    ? raw.slice(4) 
    : (raw === '/api' ? '' : raw);

  const base = getBaseApiUrl();
  const primaryUrl = base.endsWith('/api') ? `${base}${pathOnly}` : `${base}${raw}`;

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

    // If local dev server returned any error (404, 500, 502, 503, 504),
    // automatically fall back directly to the live Render Cloud backend!
    if (!res.ok && (primaryUrl.startsWith('/api') || primaryUrl.includes('localhost'))) {
      console.warn(`⚡ Local endpoint (${primaryUrl}) returned status ${res.status}, seamlessly falling back to Cloud backend:`, CLOUD_BACKEND_URL);
      const fallbackUrl = `${CLOUD_BACKEND_URL}${pathOnly}`;
      const cloudRes = await fetch(fallbackUrl, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        }
      });
      return cloudRes;
    }

    return res;
  } catch (err) {
    // If local network error or proxy connection failed, immediately fall back to Cloud backend
    if (primaryUrl.startsWith('/api') || primaryUrl.includes('localhost')) {
      console.warn('⚡ Local API unreachable, falling back to Cloud backend:', CLOUD_BACKEND_URL, err.message);
      const fallbackUrl = `${CLOUD_BACKEND_URL}${pathOnly}`;
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
