/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Resolves the full API URL.
 * In web/container development or unified deployment, uses relative path.
 * In iOS Capacitor (TestFlight) or split static hosting, uses VITE_API_URL if configured.
 */
export function getApiUrl(path: string): string {
  const envApiUrl = (import.meta as any).env?.VITE_API_URL?.trim();
  if (envApiUrl) {
    const base = envApiUrl.replace(/\/+$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${base}${cleanPath}`;
  }
  return path;
}

/**
 * Resolves the WebSocket URL.
 */
export function getWsUrl(): string {
  const envWsUrl = (import.meta as any).env?.VITE_WS_URL?.trim();
  if (envWsUrl) {
    return envWsUrl;
  }
  const envApiUrl = (import.meta as any).env?.VITE_API_URL?.trim();
  if (envApiUrl) {
    const base = envApiUrl.replace(/\/+$/, '');
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
