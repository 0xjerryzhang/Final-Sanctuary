/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Default fallback remote backend when running on static-only hosts
 * (such as GitHub Pages *.github.io or iOS Capacitor capacitor://localhost)
 * when VITE_API_URL is not explicitly overridden.
 */
const DEFAULT_REMOTE_BACKEND = 'https://ais-pre-zft2t4jfqfkvdl4edaqt36-161719948567.asia-southeast1.run.app';

function isStaticOnlyHost(): boolean {
  if (typeof window === 'undefined') return false;
  const { protocol, hostname } = window.location;
  if (protocol === 'capacitor:' || protocol === 'ionic:' || protocol === 'file:') {
    return true;
  }
  if (hostname.endsWith('.github.io') || hostname.endsWith('.pages.dev') || hostname.endsWith('.vercel.app') || hostname.endsWith('.netlify.app')) {
    return true;
  }
  return false;
}

export function getBackendBaseUrl(): string {
  try {
    const customUrl = localStorage.getItem('jj_custom_api_url')?.trim();
    if (customUrl) {
      return customUrl.replace(/\/+$/, '');
    }
  } catch {
    // ignore storage access errors
  }

  const envApiUrl = (import.meta as any).env?.VITE_API_URL?.trim();
  if (envApiUrl) {
    return envApiUrl.replace(/\/+$/, '');
  }

  if (isStaticOnlyHost()) {
    return DEFAULT_REMOTE_BACKEND;
  }

  return '';
}

/**
 * Resolves the full API URL.
 * In unified Express+Vite server, uses relative path.
 * In GitHub Pages (*.github.io) or iOS Capacitor (TestFlight), routes to the remote backend.
 */
export function getApiUrl(path: string): string {
  const base = getBackendBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (base) {
    return `${base}${cleanPath}`;
  }
  return cleanPath;
}

/**
 * Resolves the WebSocket URL.
 */
export function getWsUrl(): string {
  try {
    const customWs = localStorage.getItem('jj_custom_ws_url')?.trim();
    if (customWs) return customWs;
  } catch {
    // ignore
  }

  const envWsUrl = (import.meta as any).env?.VITE_WS_URL?.trim();
  if (envWsUrl) {
    return envWsUrl;
  }

  const base = getBackendBaseUrl();
  if (base) {
    if (base.startsWith('https://')) {
      return `${base.replace(/^https:\/\//, 'wss://')}/ws`;
    }
    if (base.startsWith('http://')) {
      return `${base.replace(/^http:\/\//, 'ws://')}/ws`;
    }
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws`;
}
