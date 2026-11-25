import crypto from "node:crypto";

const INVITE_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Excludes ambiguous 0/O/1/I
const INVITE_CODE_LENGTH = 7;
export const INVITE_CODE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function slugifyBase(name: string): string {
     const normalized = name
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .slice(0, 40);

     return normalized || "workspace";
}

export function generateWorkspaceSlug(name: string): string {
     const base = slugifyBase(name);
     const randomDigits = crypto.randomInt(1000, 10000); // 4 digits: 1000-9999
     return `${base}-${randomDigits}`;
}

export function generateInviteCode(length = INVITE_CODE_LENGTH): string {
     let code = "";
     for (let i = 0; i < length; i++) {
          const idx = crypto.randomInt(0, INVITE_CODE_CHARS.length);
          code += INVITE_CODE_CHARS[idx];
     }
     return code;
}

export function getInviteCodeExpiryDate(fromDate = new Date()): Date {
     return new Date(fromDate.getTime() + INVITE_CODE_TTL_MS);
}