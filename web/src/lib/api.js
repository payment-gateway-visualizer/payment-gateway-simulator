// Everything the app needs to talk to the backend lives here.
const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// The "session" is the JWT + user info, kept in the browser's localStorage
// so you stay logged in after a page refresh.
export const session = {
  get() { try { return JSON.parse(localStorage.getItem("pp_session")); } catch { return null; } },
  set(s) { localStorage.setItem("pp_session", JSON.stringify(s)); },
  clear() { localStorage.removeItem("pp_session"); },
};

// Where each role lands after login.
export const homeFor = (role) => "/" + (role || "login").toLowerCase();

// One function for every API call. It attaches the JWT automatically.
export async function api(path, { method = "GET", body } = {}) {
  const s = session.get();
  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers: { "Content-Type": "application/json", ...(s ? { Authorization: `Bearer ${s.token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Can't reach the server. Is the API running on " + BASE + "?");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || data.message || "Something went wrong. Try again.");
  return data;
}
