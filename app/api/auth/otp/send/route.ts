import { NextRequest, NextResponse } from "next/server";
import { randomInt } from "node:crypto";
import { discardOtp, saveOtp } from "@/lib/otp-store";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name } = body;

    if (
      !email ||
      typeof email !== "string" ||
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const recipientName = typeof name === "string" ? name.trim().slice(0, 200) : "";

    // Generate random 6-digit numeric OTP
    const otp = randomInt(100000, 1000000).toString();

    // Save to OTP store with rate limiting & 10m expiry
    const saveResult = saveOtp(normalizedEmail, otp);
    if (!saveResult.success) {
      return NextResponse.json(
        { success: false, error: saveResult.error },
        { status: 429 }
      );
    }

    const brevoApiKey = process.env.BREVO_API_KEY?.trim();
    const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim();
    const senderName = process.env.BREVO_SENDER_NAME?.trim() || "TU Coverify";

    if (!brevoApiKey || !senderEmail) {
      discardOtp(normalizedEmail);
      console.error("Brevo OTP is not configured: set BREVO_API_KEY and BREVO_SENDER_EMAIL.");
      return NextResponse.json(
        { success: false, error: "Email verification is temporarily unavailable. Please try again later." },
        { status: 503 }
      );
    }

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://tucoverify.ankitak.com.np").replace(/\/$/, "");
    const logoUrl = `${appUrl}/logo.png`;

    // Keep the email layout table-based because email clients do not consistently support site CSS.
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your TU Coverify Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: Arial, Helvetica, sans-serif; color: #09090b;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; margin: 0 auto;">
          <tr>
            <td style="height: 8px; background-color: #09090b; font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding: 26px 28px 20px; background-color: #ffffff; border-left: 1px solid #e4e4e7; border-right: 1px solid #e4e4e7;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="left" valign="middle">
                    <img src="${logoUrl}" width="42" height="42" alt="TU Coverify" style="display: inline-block; width: 42px; height: 42px; border-radius: 12px; vertical-align: middle;">
                    <span style="display: inline-block; margin-left: 10px; vertical-align: middle; font-size: 19px; line-height: 42px; font-weight: 800; letter-spacing: -0.4px; color: #09090b;">TU Coverify</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="height: 1px; background-color: #e4e4e7; font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding: 34px 28px 30px; background-color: #ffffff; border-left: 1px solid #e4e4e7; border-right: 1px solid #e4e4e7;">
              <p style="margin: 0 0 10px; font-size: 11px; line-height: 16px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; color: #16a34a;">Email verification</p>
              <h1 style="margin: 0 0 14px; font-size: 26px; line-height: 34px; font-weight: 800; letter-spacing: -0.5px; color: #09090b;">Your verification code</h1>
              <p style="margin: 0 0 8px; font-size: 15px; line-height: 24px; color: #3f3f46;">Hello ${escapeHtml(recipientName || "Student")},</p>
              <p style="margin: 0 0 24px; font-size: 14px; line-height: 23px; color: #71717a;">Use this one-time code to verify your TU Coverify account and continue creating TU cover pages, bulk covers, and lab indexes.</p>

              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 0 0 24px;">
                <tr>
                  <td align="center" style="padding: 22px 16px; background-color: #fafafa; border: 1px solid #d4d4d8; border-radius: 10px;">
                    <span style="font-family: 'Courier New', Courier, monospace; font-size: 34px; line-height: 40px; font-weight: 700; letter-spacing: 8px; color: #09090b;">${otp}</span>
                  </td>
                </tr>
              </table>

              <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 0 0 18px;">
                <tr>
                  <td valign="top" style="padding-right: 9px; font-size: 15px; line-height: 22px; color: #16a34a;">&#9679;</td>
                  <td style="font-size: 13px; line-height: 21px; color: #71717a;">This code expires in <strong style="color: #3f3f46;">10 minutes</strong>. Never share it with anyone.</td>
                </tr>
              </table>
              <p style="margin: 0; font-size: 13px; line-height: 21px; color: #a1a1aa;">If you did not request this code, you can safely ignore this email.</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 28px 28px; background-color: #fafafa; border: 1px solid #e4e4e7; text-align: center;">
              <p style="margin: 0 0 5px; font-size: 12px; line-height: 18px; font-weight: 700; color: #52525b;">TU Coverify</p>
              <p style="margin: 0; font-size: 11px; line-height: 18px; color: #a1a1aa;">Tribhuvan University Academic Suite</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Attempt sending via Brevo API if key is set
    if (brevoApiKey) {
      try {
        const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "api-key": brevoApiKey,
            "content-type": "application/json",
            accept: "application/json",
          },
          body: JSON.stringify({
            sender: {
              name: senderName,
              email: senderEmail,
            },
            to: [
              {
                email: normalizedEmail,
                name: recipientName || "TU Student",
              },
            ],
            subject: `Your TU Coverify Verification Code: ${otp}`,
            htmlContent,
          }),
        });

        if (!brevoRes.ok) {
          const errorBody = await brevoRes.text();
          const isUnauthorized = brevoRes.status === 401 || brevoRes.status === 403;
          const isIpRestriction = /authori[sz]ed ip|unrecognised ip|unauthori[sz]ed/i.test(errorBody);
          discardOtp(normalizedEmail);
          console.error("Brevo API Error:", brevoRes.status, errorBody);
          return NextResponse.json({
            success: false,
            error:
              isUnauthorized && isIpRestriction
                ? "Email verification is temporarily unavailable. Brevo is blocking this server IP. Add the server IP to Brevo's authorised IPs or disable IP restriction."
                : isUnauthorized
                ? "Email verification is temporarily unavailable. The Brevo API key is invalid or unauthorized."
                : brevoRes.status === 400
                  ? "Email verification is temporarily unavailable. Check the Brevo sender email configuration."
                  : "Email verification could not be sent. Please try again later.",
          }, { status: 502 });
        }

        return NextResponse.json({
          success: true,
          message: `Verification code sent to ${normalizedEmail}. Please check your inbox or spam folder.`,
        });
      } catch (brevoErr) {
        discardOtp(normalizedEmail);
        console.error("Failed to connect to Brevo:", brevoErr);
        return NextResponse.json({
          success: false,
          error: "Email verification could not be sent. Please try again later.",
        }, { status: 502 });
      }
    }
  } catch (error) {
    console.error("Send OTP Error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred while sending the code." },
      { status: 500 }
    );
  }
}
