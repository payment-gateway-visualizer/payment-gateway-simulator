import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";

const AUTH_URL = process.env.AUTH_URL || "http://localhost:8081";
const CLIENT_ID = "pesapay-web";
const CLIENT_SECRET = process.env.AUTH_CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:3000/auth/callback";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ action: string }> }
) {
  const { action } = await context.params;

  if (action === "start") {
    // Generate a secure PKCE verifier
    const verifier = randomBytes(32).toString("base64url");

    // Generate the PKCE challenge
    const challenge = createHash("sha256")
      .update(verifier)
      .digest("base64url");

    // Generate a random state value
    const state = randomBytes(32).toString("hex");

    // Prepare the authorization URL
    const authorizeUrl = new URL("/oauth2/authorize", AUTH_URL);

    authorizeUrl.search = new URLSearchParams({
      response_type: "code",
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      scope: "openid",
      state,
      code_challenge: challenge,
      code_challenge_method: "S256",
    }).toString();

    // Redirect to the authorization server
    const response = NextResponse.redirect(authorizeUrl);

    // Store verifier and state in temporary HttpOnly cookies
    response.cookies.set("pp_verifier", verifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/auth",
      maxAge: 300,
    });

    response.cookies.set("pp_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/auth",
      maxAge: 300,
    });

    return response;
  }

  if (action === "callback") {
  const code = request.nextUrl.searchParams.get("code");
  const returnedState = request.nextUrl.searchParams.get("state");

  const savedState = request.cookies.get("pp_state")?.value;
  const verifier = request.cookies.get("pp_verifier")?.value;

  // Check that the authorization response is valid
  if (
    !code ||
    !returnedState ||
    !savedState ||
    returnedState !== savedState ||
    !verifier
  ) {
    return NextResponse.redirect(
      new URL("/login?error=invalid_callback", request.url)
    );
  }

  if (!CLIENT_SECRET) {
    return NextResponse.json(
      { error: "Authentication configuration is missing." },
      { status: 500 }
    );
  }

  // Exchange the authorization code for tokens
  const credentials = Buffer.from(
    `${CLIENT_ID}:${CLIENT_SECRET}`
  ).toString("base64");

  const tokenResponse = await fetch(`${AUTH_URL}/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: verifier,
    }),
    cache: "no-store",
  });

  if (!tokenResponse.ok) {
    return NextResponse.redirect(
      new URL("/login?error=token_exchange_failed", request.url)
    );
  }

  const tokens = await tokenResponse.json();

  if (
    typeof tokens.access_token !== "string" ||
    typeof tokens.id_token !== "string" ||
    typeof tokens.refresh_token !== "string" ||
    typeof tokens.expires_in !== "number"
  ) {
    return NextResponse.json(
      { error: "Invalid token response." },
      { status: 502 }
    );
  }

  // Decode the access token payload
const payload = (token: string) =>
  JSON.parse(
    Buffer.from(token.split(".")[1], "base64url").toString()
  );

// Extract the user's role
const role = payload(tokens.access_token).role;

// Extract the user's first name from the ID token
const firstName = payload(tokens.id_token).given_name;

// Select the correct dashboard
const dashboard =
  role === "CUSTOMER"
    ? "/customer"
    : role === "MERCHANT"
    ? "/merchant"
    : role === "ADMIN"
    ? "/admin"
    : "/login";

// Redirect the user
const response = NextResponse.redirect(
  new URL(dashboard, request.url)
);

  response.cookies.set("pp_token", tokens.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: tokens.expires_in,
  });

  response.cookies.set("pp_refresh", tokens.refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/auth",
    maxAge: 7 * 24 * 60 * 60,
  });

  response.cookies.set("pp_verifier", "", {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/auth",
  maxAge: 0,
});

response.cookies.set("pp_state", "", {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/auth",
  maxAge: 0,
});

  return response;
}

return NextResponse.json(
  { error: "Not found" },
  { status: 404 }
);
}


export async function POST(
  request: NextRequest,
  context: { params: Promise<{ action: string }> }
) {
  const { action } = await context.params;

  if (action === "refresh") {
    const refreshToken = request.cookies.get("pp_refresh")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: "Please sign in again." },
        { status: 401 }
      );
    }

    if (!CLIENT_SECRET) {
      return NextResponse.json(
        { error: "Authentication configuration is missing." },
        { status: 500 }
      );
    }

    const credentials = Buffer.from(
      `${CLIENT_ID}:${CLIENT_SECRET}`
    ).toString("base64");

    const tokenResponse = await fetch(`${AUTH_URL}/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
      cache: "no-store",
    });

    if (!tokenResponse.ok) {
      const response = NextResponse.json(
        { error: "Session expired. Please sign in again." },
        { status: 401 }
      );

      response.cookies.set("pp_token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 0,
      });

      response.cookies.set("pp_refresh", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/auth",
        maxAge: 0,
      });

      return response;
    }

    const tokens = await tokenResponse.json();

    if (
      typeof tokens.access_token !== "string" ||
      typeof tokens.refresh_token !== "string" ||
      typeof tokens.expires_in !== "number"
    ) {
      return NextResponse.json(
        { error: "Invalid token response." },
        { status: 502 }
      );
    }

    const response = NextResponse.json({ success: true });

    response.cookies.set("pp_token", tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: tokens.expires_in,
    });

    response.cookies.set("pp_refresh", tokens.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/auth",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  }

  if (action === "logout") {
  const refreshToken = request.cookies.get("pp_refresh")?.value;

  if (!CLIENT_SECRET) {
    return NextResponse.json(
      { error: "Authentication configuration is missing." },
      { status: 500 }
    );
  }

  if (refreshToken) {
    const credentials = Buffer.from(
      `${CLIENT_ID}:${CLIENT_SECRET}`
    ).toString("base64");

    await fetch(`${AUTH_URL}/oauth2/revoke`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        token: refreshToken,
        token_type_hint: "refresh_token",
      }),
      cache: "no-store",
    });
  }

  const response = NextResponse.json({ success: true });

  response.cookies.set("pp_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });

  response.cookies.set("pp_refresh", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/auth",
    maxAge: 0,
  });

  return response;
}

return NextResponse.json(
  { error: "Not found" },
  { status: 404 }
);
}
