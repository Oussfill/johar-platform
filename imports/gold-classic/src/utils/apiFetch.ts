// ============================================================================
// GOLD PLATFORM — API FETCH UTILITY
// ============================================================================
// دالة fetch موحدة تضيف Authorization header تلقائياً من localStorage

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('gold-token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return fetch(url, { ...options, headers });
}
