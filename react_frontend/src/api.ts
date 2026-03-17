import { clearSession, getAuthToken } from './auth';

const BASE_URL = `http://${window.location.hostname}:3333`;

export async function api(path: string, options: RequestInit = {}) {
  const token = getAuthToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
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
