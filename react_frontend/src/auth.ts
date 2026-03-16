export type SessionUser = {
  id: number;
  email: string;
  username: string;
  isAdmin: boolean;
};

type SessionPayload = SessionUser & {
  token: string;
};

const TOKEN_KEY = 'token';
const USER_KEY = 'sessionUser';

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getSessionUser(): SessionUser | null {
  const rawUser = localStorage.getItem(USER_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as SessionUser;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function storeSession({ token, ...user }: SessionPayload) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getHomePath(user = getSessionUser()) {
  return user?.isAdmin ? '/admin/dashboard' : '/dashboard';
}
