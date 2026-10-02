/**
 * Real-time Cloud API Client & Configuration
 * Provides seamless multi-device cloud synchronization with automatic fallback.
 */

export const CLOUD_BACKEND_URL = 'https://rental-management-system-yjfg.onrender.com/api';

export function getBaseApiUrl() {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
    let clean = envUrl.trim().replace(/\/$/, '');
    // Ensure base ends with /api so it always routes to the API
    if (!clean.endsWith('/api') && !clean.includes('/api/')) {
      clean = `${clean}/api`;
    }
    return clean;
  }
  
  if (typeof window !== 'undefined') {
    // If on localhost in dev mode, use local proxy /api
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
  let raw = (endpoint || '').trim();
  if (!raw.startsWith('/')) raw = `/${raw}`;
  
  // pathOnly will be e.g. '/sync'
  const pathOnly = raw.startsWith('/api/') ? raw.slice(4) : (raw === '/api' ? '' : raw);

  const base = getBaseApiUrl().replace(/\/$/, '');
  const primaryUrl = base.endsWith('/api') ? `${base}${pathOnly}` : `${base}/api${pathOnly}`;

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
    // If network error or proxy connection failed, immediately fall back to Cloud backend
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
