import { clearSession, getAuthToken } from './auth';

const BASE_URL =
  process.env.REACT_APP_API_URL || `http://${window.location.hostname}:3333`;

export async function api(path: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const isFormData = options.body instanceof FormData;

  const headers = new Headers(options.headers);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Let the browser define multipart Content-Type with boundary for FormData.
  if (isFormData) {
    headers.delete('Content-Type');
  } else if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const isLoginRequest =
    path.startsWith('/sessions') &&
    (options.method?.toUpperCase() ?? 'GET') === 'POST';

  if (res.status === 401 && !isLoginRequest) {
    clearSession();
    window.location.href = '/login';
    throw new Error('Sessão expirada');
  }

  return res;
}
