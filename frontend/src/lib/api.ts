const BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";

const SESSION_KEY = "pp_session";
const TOKEN_KEY = "pp_token";

// localStorage only exists in the browser, so the token helpers guard
// against server-side rendering in Next.js.
export function getToken(): string | null {
  if (typeof window === "undefined") return null;

  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Storage can be blocked (private mode, full quota). Fail quietly.
  }
}

export function removeToken(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Nothing to do.
  }
}

const MESSAGES: Record<string, string> = {
  EMAIL_TAKEN: "That email is already registered. Try signing in.",
  PHONE_TAKEN: "That phone number is already in use.",
  VALIDATION_FAILED: "Some details aren't valid. Please check and try again.",
  INVALID_CREDENTIALS: "Wrong email or password.",
};

// Any value that can be sent as, or read from, JSON.
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface UserSession {
  user: {
    role: string;
    name?: string;
  };
  expiresAt: number;
}

export const session = {
  get(): UserSession | null {
    try {
      const stored = localStorage.getItem(SESSION_KEY);

      if (!stored) return null;

      const saved = JSON.parse(stored) as UserSession;

      if (saved.expiresAt && Date.now() > saved.expiresAt) {
        localStorage.removeItem(SESSION_KEY);
        removeToken();
        return null;
      }

      return saved;
    } catch {
      return null;
    }
  },

  set(value: UserSession): void {
    localStorage.setItem(SESSION_KEY, JSON.stringify(value));
  },

  clear(): void {
    localStorage.removeItem(SESSION_KEY);
    removeToken();

    fetch(BASE + "/api/v1/auth/logout", {
      method: "POST",
      credentials: "include",
      keepalive: true,
    }).catch(() => {});
  },
};

export const homeFor = (role?: string | null): string =>
  "/" + (role || "login").toLowerCase();

interface ApiOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: JsonValue;
  // Set to false for public endpoints (login, register) so no token is sent.
  auth?: boolean;
}

interface ApiErrorInfo {
  code: string;
  message: string;
}

// Safely reads the error code and message from an error response body.
function readError(data: JsonValue): ApiErrorInfo {
  if (typeof data === "object" && data !== null && !Array.isArray(data)) {
    const code = data.error;
    const message = data.message;

    return {
      code: typeof code === "string" ? code : "",
      message: typeof message === "string" ? message : "",
    };
  }

  return { code: "", message: "" };
}

export async function api<T = JsonValue>(
  path: string,
  { method = "GET", body, auth = true }: ApiOptions = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const token = auth ? getToken() : null;

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;

  try {
    response = await fetch(BASE + path, {
      method,
      credentials: "include",
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error(
      "Can't reach the server. Is the API running on " + BASE + "?"
    );
  }

  const data: JsonValue = await response.json().catch(() => ({}));

  if (!response.ok) {
    // Expired or invalid token on a protected request: drop the stale login.
    if (response.status === 401 && token) {
      removeToken();
      localStorage.removeItem(SESSION_KEY);
    }

    const { code, message } = readError(data);

    throw new Error(
      MESSAGES[code] || message || "Something went wrong. Try again."
    );
  }

  return data as T;
}