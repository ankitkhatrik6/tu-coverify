import { NextRequest, NextResponse } from "next/server";
import { verifyOtpCode } from "@/lib/otp-store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, otp } = body;

    if (
      typeof email !== "string" ||
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      typeof otp !== "string" ||
      !/^\d{6}$/.test(otp)
    ) {
      return NextResponse.json(
        { success: false, error: "Email and verification code are required." },
        { status: 400 }
      );
    }

    const verifyResult = verifyOtpCode(email, otp);
    if (!verifyResult.success) {
      return NextResponse.json(
        { success: false, error: verifyResult.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      verified: true,
      message: "Email successfully verified!",
    });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred during verification." },
      { status: 500 }
    );
  }
}
