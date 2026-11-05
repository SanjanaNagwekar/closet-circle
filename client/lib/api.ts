const API_PROXY_PREFIX = '/backend-api';

export function apiUrl(path: string): string {
  if (!path.startsWith('/')) {
    throw new Error(`API paths must begin with "/": ${path}`);
  }

  const backendPath = path.startsWith('/api/') ? path.slice('/api'.length) : path;
  return `${API_PROXY_PREFIX}${backendPath}`;
}
