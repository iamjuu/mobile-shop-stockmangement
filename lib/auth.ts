import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const AUTH_COOKIE = "stock_management_token";
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

type JwtPayload = {
  sub: string;
  email: string;
  role: string;
  exp: number;
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET is required in production");
  }

  return secret ?? "stock-management-dev-secret";
}

function base64Url(input: Buffer | string) {
  return Buffer.from(input).toString("base64url");
}

function sign(data: string) {
  return createHmac("sha256", getJwtSecret()).update(data).digest("base64url");
}

function createToken(payload: Omit<JwtPayload, "exp">) {
  const header = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64Url(
    JSON.stringify({
      ...payload,
      exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
    })
  );
  const signature = sign(`${header}.${body}`);

  return `${header}.${body}.${signature}`;
}

function verifyToken(token: string): JwtPayload | null {
  const [header, body, signature] = token.split(".");

  if (!header || !body || !signature) {
    return null;
  }

  const expectedSignature = sign(`${header}.${body}`);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as JwtPayload;

  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return payload;
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");

  return `${salt}:${hash}`;
}

export function verifyPassword(
  password: string,
  storedPassword: string | null | undefined
) {
  if (!storedPassword) {
    return false;
  }

  const [salt, hash] = storedPassword.split(":");

  if (!salt || !hash) {
    return false;
  }

  const hashBuffer = Buffer.from(hash, "hex");
  const passwordHashBuffer = scryptSync(password, salt, 64);

  return (
    hashBuffer.length === passwordHashBuffer.length &&
    timingSafeEqual(hashBuffer, passwordHashBuffer)
  );
}

export async function createAuthSession(user: {
  id: string;
  email: string;
  role: string;
}) {
  const token = createToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });

  (await cookies()).set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TOKEN_TTL_SECONDS,
  });
}

export async function clearAuthSession() {
  (await cookies()).delete(AUTH_COOKIE);
}

export async function getSessionPayload() {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}

export async function getCurrentUserId() {
  const session = await getSessionPayload();

  if (!session?.sub) {
    throw new Error("Unauthorized");
  }

  return session.sub;
}
