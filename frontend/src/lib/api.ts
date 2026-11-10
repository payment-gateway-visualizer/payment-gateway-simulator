// Everything the app needs to communicate with the backend lives here.

const BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";

// Possible user roles.
export type UserRole = "CUSTOMER" | "MERCHANT" | "ADMIN";

// Information stored about the logged-in user.
export interface UserSession {
  token: string;
  user: {
    role: UserRole | string;
    name?: string;
  };
  expiresAt: number;
}

// Structure of an API error response.
interface ApiErrorResponse {
  error?: string;
  message?: string;
}

// Options accepted by the API function.
interface ApiOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
}

// Backend error codes and their friendly messages.
const MESSAGES: Record<string, string> = {
  EMAIL_TAKEN: "That email is already registered. Try signing in.",
  PHONE_TAKEN: "That phone number is already in use.",
  VALIDATION_FAILED:
    "Some details aren't valid. Please check and try again.",
  INVALID_CREDENTIALS: "Wrong email or password.",
};

// Session management.
// This uses browser localStorage to keep the JWT between page refreshes.
export const session = {
  get(): UserSession | null {
    // localStorage is only available in the browser.
    if (typeof window === "undefined") {
      return null;
    }

    try {
      const savedSession = localStorage.getItem("pp_session");

      if (!savedSession) {
        return null;
      }

      const parsed: unknown = JSON.parse(savedSession);

      if (
        typeof parsed !== "object" ||
        parsed === null ||
        !("token" in parsed) ||
        !("expiresAt" in parsed) ||
        typeof parsed.token !== "string" ||
        typeof parsed.expiresAt !== "number"
      ) {
        localStorage.removeItem("pp_session");
        return null;
      }

      const userSession = parsed as UserSession;

      // Check whether the JWT session has expired.
      if (Date.now() >= userSession.expiresAt) {
        localStorage.removeItem("pp_session");
        return null;
      }

      return userSession;
    } catch {
      return null;
    }
  },

  set(userSession: UserSession): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "pp_session",
        JSON.stringify(userSession)
      );
    }
  },

  clear(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("pp_session");
    }
  },
};

// Determine where a user should go after logging in.
export function homeFor(role?: string | null): string {
  return "/" + (role || "login").toLowerCase();
}

// A reusable function for communicating with the backend.
export async function api<T = unknown>(
  path: string,
  { method = "GET", body }: ApiOptions = {}
): Promise<T> {
  const currentSession = session.get();

  let response: Response;

  try {
    response = await fetch(BASE + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(currentSession
          ? { Authorization: `Bearer ${currentSession.token}` }
          : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error(
      "Can't reach the server. Is the API running on " + BASE + "?"
    );
  }

  const data: unknown = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorData = data as ApiErrorResponse;

    const message =
      (errorData.error && MESSAGES[errorData.error]) ||
      errorData.message ||
      "Something went wrong. Try again.";

    throw new Error(message);
  }

  return data as T;
}
