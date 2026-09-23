export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}/api${path}`, { ...init, credentials: 'include', headers: init?.body instanceof FormData ? init.headers : { 'content-type': 'application/json', ...init?.headers } });
  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined') {
      const protectedRoutes = ['/app', '/profile', '/travel-plans', '/matching', '/circle', '/journey', '/safety', '/verification', '/admin'];
      const currentPath = window.location.pathname;
      if (protectedRoutes.some((route) => currentPath === route || currentPath.startsWith(`${route}/`))) {
        const next = `${currentPath}${window.location.search}${window.location.hash}`;
        window.location.replace(`/login?next=${encodeURIComponent(next)}`);
      }
    }
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message ?? `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}
