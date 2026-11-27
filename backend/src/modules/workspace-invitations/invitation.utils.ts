import crypto from "node:crypto";
import { env } from "../../config/index.js";
import { AppError } from "../../shared/errors/index.js";
import { resend } from "../../shared/mail/resend.client.js";
import type { SendWorkspaceInviteEmailParams } from "./invitation.types.js";

export const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const FROM_EMAIL = env.RESEND_FROM_EMAIL || "Karyashala <noreply@contact.karyashala.tech>";
const DEFAULT_APP_URL = "http://localhost:3000";

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
     const baseUrl = (env.APP_URL || DEFAULT_APP_URL).replace(/\/+$/, "");
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

function sanitizeHeader(value: string): string {
     return value.replace(/[\r\n]+/g, " ").trim();
}

export async function sendWorkspaceInviteEmail(
     params: SendWorkspaceInviteEmailParams,
): Promise<void> {
     const inviteUrl = buildInviteUrl(params.rawToken);

     const safeWorkspaceName = escapeHtml(params.workspaceName);
     const safeInviterName = escapeHtml(params.inviterName);
     const safeEmail = escapeHtml(params.toEmail);
     const safeRole = escapeHtml(params.role);
     const safeInviteUrl = escapeHtml(inviteUrl);

     const subject = sanitizeHeader(
          `${params.inviterName} invited you to collaborate in "${params.workspaceName}" on Karyashala`,
     );

     const text = [
          `Hello,`,
          `${params.inviterName} has invited you to join the "${params.workspaceName}" workspace on Karyashala.`,
          `Invitation Details:\n- Workspace: ${params.workspaceName}\n- Role: ${params.role}\n- Invited by: ${params.inviterName}`,
          `Accept your invitation by visiting the link below:\n${inviteUrl}`,
          `Security Notice: This invitation was intended exclusively for ${params.toEmail} and will expire in 7 days. If you were not expecting this invitation, you can safely ignore this email.`,
          `Best regards,\nThe Karyashala Team`,
     ].join("\n\n");

     const html = `
    <div style="background-color: #f9fafb; padding: 32px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111827;">
      <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 32px;">
        <div style="margin-bottom: 24px;">
          <span style="font-size: 18px; font-weight: 700; letter-spacing: -0.02em; color: #111827;">Karyashala</span>
        </div>

        <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #111827;">
          You’ve been invited to join ${safeWorkspaceName}
        </h2>

        <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #374151;">
          <strong>${safeInviterName}</strong> has invited you to collaborate in the <strong>${safeWorkspaceName}</strong> workspace on Karyashala.
        </p>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; background-color: #f9fafb; border-radius: 6px;">
          <tr>
            <td style="padding: 10px 14px; font-size: 13px; color: #6b7280; border-bottom: 1px solid #e5e7eb; width: 110px;">Workspace</td>
            <td style="padding: 10px 14px; font-size: 13px; font-weight: 600; color: #111827; border-bottom: 1px solid #e5e7eb;">${safeWorkspaceName}</td>
          </tr>
          <tr>
            <td style="padding: 10px 14px; font-size: 13px; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Role</td>
            <td style="padding: 10px 14px; font-size: 13px; font-weight: 600; color: #111827; border-bottom: 1px solid #e5e7eb;">${safeRole}</td>
          </tr>
          <tr>
            <td style="padding: 10px 14px; font-size: 13px; color: #6b7280;">Invited by</td>
            <td style="padding: 10px 14px; font-size: 13px; font-weight: 600; color: #111827;">${safeInviterName}</td>
          </tr>
        </table>

        <div style="margin: 28px 0;">
          <a
            href="${safeInviteUrl}"
            style="background-color: #111827; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-size: 14px; font-weight: 600;"
          >
            Accept Invitation
          </a>
        </div>

        <p style="margin: 0 0 24px; font-size: 13px; line-height: 1.5; color: #6b7280;">
          If the button above doesn't work, copy and paste this link into your browser:<br />
          <a href="${safeInviteUrl}" style="color: #2563eb; word-break: break-all;">${safeInviteUrl}</a>
        </p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />

        <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #6b7280;">
          This invitation was sent specifically to <strong>${safeEmail}</strong> and will expire in <strong>7 days</strong>. If you weren't expecting this invitation, you can safely ignore this email.
        </p>
      </div>
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
          console.error("[Resend workspace invite error]:", error);
          throw new AppError(
               error.message || "Failed to send workspace invitation email.",
               502,
               "EMAIL_SEND_FAILED",
          );
     }
}
