// Everything the app needs to talk to the backend lives here.
const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";

// The backend sends error CODES. This turns them into friendly sentences.
const MESSAGES = {
  EMAIL_TAKEN: "That email is already registered. Try signing in.",
  PHONE_TAKEN: "That phone number is already in use.",
  VALIDATION_FAILED: "Some details aren't valid. Please check and try again.",
  INVALID_CREDENTIALS: "Wrong email or password.",
};

// The "session" is the token + basic user info, kept in the browser's localStorage
// so you stay signed in after a refresh. It expires when the backend's token does.
export const session = {
  get() {
    try {
      const s = JSON.parse(localStorage.getItem("pp_session"));
      if (s && s.expiresAt && Date.now() > s.expiresAt) {
        localStorage.removeItem("pp_session"); // token has expired
        return null;
      }
      return s;
    } catch { return null; }
  },
  set(s) { localStorage.setItem("pp_session", JSON.stringify(s)); },
  clear() { localStorage.removeItem("pp_session"); },
};

// Where each role lands after login.
export const homeFor = (role) => "/" + (role || "login").toLowerCase();

// One function for every API call. It attaches the token automatically.
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
  if (!res.ok) throw new Error(MESSAGES[data.error] || data.message || "Something went wrong. Try again.");
  return data;
}