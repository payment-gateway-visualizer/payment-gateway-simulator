
const BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";

const MESSAGES: Record<string, string> = {
  EMAIL_TAKEN: "That email is already registered. Try signing in.",
  PHONE_TAKEN: "That phone number is already in use.",
  VALIDATION_FAILED: "Some details aren't valid. Please check and try again.",
  INVALID_CREDENTIALS: "Wrong email or password.",
};

export interface UserSession {
  token: string;
  user: {
    role: string;
    name?: string;
  };
  expiresAt: number;
}

export const session = {
  get(): UserSession | null {
    try {
      const stored = localStorage.getItem("pp_session");

      if (!stored) return null;

      const saved = JSON.parse(stored) as UserSession;

      if (saved.expiresAt && Date.now() > saved.expiresAt) {
        localStorage.removeItem("pp_session");
        return null;
      }

      return saved;
    } catch {
      return null;
    }
  },

  set(value: UserSession): void {
    localStorage.setItem("pp_session", JSON.stringify(value));
  },

  clear(): void {
    localStorage.removeItem("pp_session");
  },
};

export const homeFor = (role?: string | null): string =>
  "/" + (role || "login").toLowerCase();

interface ApiOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
}

export async function api<T = unknown>(
  path: string,
  { method = "GET", body }: ApiOptions = {}
): Promise<T> {
  const savedSession = session.get();

  let response: Response;

  try {
    response = await fetch(BASE + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(savedSession
          ? { Authorization: `Bearer ${savedSession.token}` }
          : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error(
      "Can't reach the server. Is the API running on " + BASE + "?"
    );
  }

  const data: Record<string, unknown> = await response
    .json()
    .catch(() => ({}));

  if (!response.ok) {
    const errorCode =
      typeof data.error === "string" ? data.error : "";

    const message =
      typeof data.message === "string" ? data.message : "";

    throw new Error(
      MESSAGES[errorCode] || message || "Something went wrong. Try again."
    );
  }

  return data as T;
}
