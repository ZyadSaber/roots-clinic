import * as jose from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { UserData } from "@/types/users";

if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("JWT_SECRET must be set in production");
}

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "default_secret_please_change",
);

export async function hashPassword(password: string) {
  return await bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hashed: string) {
  return await bcrypt.compare(password, hashed);
}

export async function signToken(
  payload: UserData,
  exp?: string | number | Date,
) {
  let jwt = new jose.SignJWT(payload as unknown as jose.JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt();

  if (exp) {
    if (typeof exp === "number") {
      jwt = jwt.setExpirationTime(exp);
    } else {
      jwt = jwt.setExpirationTime(exp.toString());
    }
  } else {
    jwt = jwt.setExpirationTime("24h");
  }

  return await jwt.sign(secret);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jose.jwtVerify(token, secret);
    return payload as jose.JWTPayload & UserData;
  } catch {
    return null;
  }
}

export async function getAuthSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;
  return await verifyToken(token);
}
