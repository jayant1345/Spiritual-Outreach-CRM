import crypto from "crypto";
import { cookies } from "next/headers";
import prisma from "./prisma";

const AUTH_COOKIE_NAME = "chandkheda_crm_session";
const SESSION_SECRET = process.env.SESSION_SECRET || "chandkheda-spiritual-crm-sacred-key-2026";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  username?: string | null;
  phone?: string | null;
  role: "SUPER_ADMIN" | "COORDINATOR" | "CALLING_VOLUNTEER" | "RELATIONSHIP_VOLUNTEER";
  avatar?: string | null;
  privileges?: string[] | null;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return salt + ":" + hash;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.includes(":")) return false;
  const [salt, originalHash] = storedHash.split(":");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return hash === originalHash;
}

export function createSessionToken(user: SessionUser): string {
  const payload = JSON.stringify({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
  });

  const base64Payload = Buffer.from(payload).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(base64Payload)
    .digest("base64url");

  return base64Payload + "." + signature;
}

export function verifySessionToken(token: string): { id: string; email: string; name: string; role: SessionUser["role"]; exp: number } | null {
  try {
    if (!token || !token.includes(".")) return null;
    const [base64Payload, signature] = token.split(".");

    const expectedSignature = crypto
      .createHmac("sha256", SESSION_SECRET)
      .update(base64Payload)
      .digest("base64url");

    if (signature !== expectedSignature) return null;

    const jsonStr = Buffer.from(base64Payload, "base64url").toString("utf8");
    const data = JSON.parse(jsonStr);

    if (data.exp && Date.now() > data.exp) {
      return null;
    }

    return data;
  } catch (error) {
    return null;
  }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = verifySessionToken(token);
    if (!payload?.id) return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.id, active: true },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        phone: true,
        role: true,
        avatar: true,
        privileges: true,
      },
    });

    if (!user) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      phone: user.phone,
      role: user.role as SessionUser["role"],
      avatar: user.avatar,
      privileges: user.privileges ? JSON.parse(user.privileges) : null,
    };
  } catch (err) {
    console.error("Error fetching current user:", err);
    return null;
  }
}

export const AUTH_COOKIE = AUTH_COOKIE_NAME;
