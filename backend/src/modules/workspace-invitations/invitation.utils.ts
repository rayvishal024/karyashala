import crypto from "node:crypto";
import { env } from "../../config/index.js";
import { AppError } from "../../shared/errors/index.js";
import { resend } from "../../shared/mail/resend.client.js";
import type { SendWorkspaceInviteEmailParams } from "./invitation.types.js";

export const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const FROM_EMAIL = "Karyashala <invite@karyashala.tech>";

export function generateRawInviteToken(): string {
     return crypto.randomBytes(32).toString("hex");
}

export function hashInviteToken(rawToken: string): string {
     return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export function getInviteExpiryDate(fromDate = new Date()): Date {
     return new Date(fromDate.getTime() + INVITE_TTL_MS);
}

export function buildInviteUrl(rawToken: string): string {
     const baseUrl = (env.APP_URL || "https://karyashala.tech").replace(/\/+$/, "");
     return `${baseUrl}/invite/${rawToken}`;
}

function escapeHtml(value: string): string {
     return value
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;");
}

export async function sendWorkspaceInviteEmail(
     params: SendWorkspaceInviteEmailParams,
): Promise<void> {
     const inviteUrl = buildInviteUrl(params.rawToken);
     const safeWorkspaceName = escapeHtml(params.workspaceName);
     const safeInviterName = escapeHtml(params.inviterName);
     const safeEmail = escapeHtml(params.toEmail);
     const safeRole = escapeHtml(params.role);

     const subject = `${params.inviterName} invited you to join "${params.workspaceName}" on Karyashala`;

     const text = [
          `${params.inviterName} invited you to join "${params.workspaceName}" on Karyashala.`,
          `Workspace: ${params.workspaceName}`,
          `Invited by: ${params.inviterName}`,
          `Role: ${params.role}`,
          `Accept invite: ${inviteUrl}`,
          `This link is only for ${params.toEmail} and expires in 7 days. If you did not request this, ignore this email.`,
     ].join("\n\n");

     const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827; max-width: 560px; margin: 0 auto;">
      <h2 style="margin-bottom: 12px;">You're invited to join ${safeWorkspaceName}</h2>
      <p><strong>${safeInviterName}</strong> invited you to join the workspace <strong>${safeWorkspaceName}</strong> on Karyashala as a <strong>${safeRole}</strong>.</p>
      <p style="margin: 24px 0;">
        <a
          href="${inviteUrl}"
          style="background-color: #111827; color: #ffffff; padding: 12px 20px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;"
        >
          Join Workspace
        </a>
      </p>
      <p style="font-size: 13px; color: #4b5563;">
        This link is only for ${safeEmail} and expires in 7 days. If you did not request this, ignore this email.
      </p>
    </div>
  `;

     const { error } = await resend.emails.send({
          from: FROM_EMAIL,
          to: [params.toEmail],
          subject,
          text,
          html,
     });

     if (error) {
          throw new AppError(
               "Failed to send workspace invitation email.",
               502,
               "EMAIL_SEND_FAILED",
          );
     }
}