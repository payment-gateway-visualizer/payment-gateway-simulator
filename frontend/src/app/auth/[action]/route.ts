import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";

const AUTH_URL = process.env.AUTH_URL || "http://localhost:8081";
const CLIENT_ID = "pesapay-web";
const CLIENT_SECRET = process.env.AUTH_CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:3000/auth/callback";
const HOME: Record<string, string> = {
  CUSTOMER: "/customer",
  MERCHANT: "/merchant",
  ADMIN: "/admin",
};

interface Tokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  id_token?: string;
}

type Context = { params: Promise<{ action: string }> };

const fail = (error: string, status: number) =>
  NextResponse.json({ error }, { status });

const CONFIG_ERROR = "Authentication configuration is missing.";


function cookie(
  res: NextResponse,
  name: string,
  value: string,
  path: string,
  maxAge: number,
  sameSite: "lax" | "strict" = "strict"
) {
  res.cookies.set(name, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite,
    path,
    maxAge,
  });
}

const setSession = (res: NextResponse, t: Tokens) => {
  cookie(res, "pp_token", t.access_token, "/", t.expires_in);
  cookie(res, "pp_refresh", t.refresh_token, "/auth", 7 * 24 * 60 * 60);
};

const clearSession = (res: NextResponse) => {
  cookie(res, "pp_token", "", "/", 0);
  cookie(res, "pp_refresh", "", "/auth", 0);
  cookie(res, "pp_name", "", "/", 0);
};


function post(path: string, body: Record<string, string>) {
  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");

  return fetch(`${AUTH_URL}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(body),
    cache: "no-store",
  });
}

async function readTokens(res: Response): Promise<Tokens | null> {
  const t = (await res.json()) as Partial<Tokens>;

  return t.access_token && t.refresh_token && t.expires_in
    ? {
        access_token: t.access_token,
        refresh_token: t.refresh_token,
        expires_in: t.expires_in,
        id_token: t.id_token,
      }
    : null;
}


const claims = (token: string) =>
  JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString()) as {
    role?: string;
    given_name?: string;
  };

export async function GET(request: NextRequest, { params }: Context) {
  const { action } = await params;

  if (action === "start") {
    const verifier = randomBytes(32).toString("base64url");
    const state = randomBytes(32).toString("hex");
    const challenge = createHash("sha256").update(verifier).digest("base64url");

    const url = new URL("/oauth2/authorize", AUTH_URL);
    url.search = new URLSearchParams({
      response_type: "code",
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      scope: "openid",
      state,
      code_challenge: challenge,
      code_challenge_method: "S256",
    }).toString();

    const res = NextResponse.redirect(url);
    cookie(res, "pp_verifier", verifier, "/auth", 300, "lax");
    cookie(res, "pp_state", state, "/auth", 300, "lax");
    return res;
  }

  if (action === "callback") {
    const code = request.nextUrl.searchParams.get("code");
    const state = request.nextUrl.searchParams.get("state");
    const verifier = request.cookies.get("pp_verifier")?.value;

    const savedState = request.cookies.get("pp_state")?.value;

    if (!code || !state || !verifier || state !== savedState) {
      console.error("Invalid callback:", {
        hasCode: !!code,
        hasState: !!state,
        hasVerifierCookie: !!verifier,
        hasStateCookie: !!savedState,
        stateMatches: state === savedState,
        host: request.nextUrl.host,
      });
      return NextResponse.redirect(new URL("/login?error=invalid_callback", request.url));
    }

    if (!CLIENT_SECRET) return fail(CONFIG_ERROR, 500);

    const tokenResponse = await post("/oauth2/token", {
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: verifier,
    });

    if (!tokenResponse.ok) {
      console.error("Token exchange failed:", tokenResponse.status, await tokenResponse.text());
      return NextResponse.redirect(new URL("/login?error=token_exchange_failed", request.url));
    }

    const tokens = await readTokens(tokenResponse);
    if (!tokens) return fail("Invalid token response.", 502);

    const { role } = claims(tokens.access_token);
    const name = tokens.id_token ? claims(tokens.id_token).given_name : undefined;

    const res = NextResponse.redirect(new URL(HOME[role ?? ""] ?? "/login", request.url));
    setSession(res, tokens);
    if (name) cookie(res, "pp_name", name, "/", 7 * 24 * 60 * 60);
    cookie(res, "pp_verifier", "", "/auth", 0, "lax");
    cookie(res, "pp_state", "", "/auth", 0, "lax");
    return res;
  }

  
  if (action === "me") {
    const token = request.cookies.get("pp_token")?.value;
    if (!token) return fail("Not signed in.", 401);

    const { role } = claims(token);
    return NextResponse.json({
      role: (role ?? "").toLowerCase(),
      name: request.cookies.get("pp_name")?.value,
    });
  }

  return fail("Not found", 404);
}

export async function POST(request: NextRequest, { params }: Context) {
  const { action } = await params;
  const refreshToken = request.cookies.get("pp_refresh")?.value;

  if (action === "refresh") {
    if (!refreshToken) return fail("Please sign in again.", 401);
    if (!CLIENT_SECRET) return fail(CONFIG_ERROR, 500);

    const tokenResponse = await post("/oauth2/token", {
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    });

    if (!tokenResponse.ok) {
      const res = fail("Session expired. Please sign in again.", 401);
      clearSession(res);
      return res;
    }

    const tokens = await readTokens(tokenResponse);
    if (!tokens) return fail("Invalid token response.", 502);

    const res = NextResponse.json({ success: true });
    setSession(res, tokens);
    return res;
  }

  if (action === "logout") {
    if (!CLIENT_SECRET) return fail(CONFIG_ERROR, 500);

    if (refreshToken) {
      await post("/oauth2/revoke", {
        token: refreshToken,
        token_type_hint: "refresh_token",
      });
    }

    const res = NextResponse.json({ success: true });
    clearSession(res);
    return res;
  }

  return fail("Not found", 404);
}