function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
}

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("admin_token");
}

async function apiFetch(path: string, opts: RequestInit = {}) {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as Record<string, string> ?? {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(path, { ...opts, headers });
  return res;
}

async function adminFetch(path: string, opts: RequestInit = {}) {
  const token = getAdminToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as Record<string, string> ?? {}),
  };
  if (token) headers["X-Admin-Token"] = token;
  const res = await fetch(path, { ...opts, headers });
  return res;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await apiFetch(path);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await apiFetch(path, { method: "POST", body: JSON.stringify(body) });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function throwApiError(res: Response): Promise<never> {
  const text = await res.text();
  try {
    const json = JSON.parse(text);
    throw new Error(json.error || json.message || text);
  } catch (e) {
    if (e instanceof SyntaxError) throw new Error(text);
    throw e;
  }
}

export async function adminGet<T>(path: string): Promise<T> {
  const res = await adminFetch(path);
  if (!res.ok) await throwApiError(res);
  return res.json();
}

export async function adminPost<T>(path: string, body: unknown): Promise<T> {
  const res = await adminFetch(path, { method: "POST", body: JSON.stringify(body) });
  if (!res.ok) await throwApiError(res);
  return res.json();
}

export async function adminPatch<T>(path: string, body: unknown): Promise<T> {
  const res = await adminFetch(path, { method: "PATCH", body: JSON.stringify(body) });
  if (!res.ok) await throwApiError(res);
  return res.json();
}

export async function adminDelete<T>(path: string): Promise<T> {
  const res = await adminFetch(path, { method: "DELETE" });
  if (!res.ok) await throwApiError(res);
  return res.json();
}
