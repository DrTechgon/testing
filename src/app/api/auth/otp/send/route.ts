import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type OtpSendPayload = {
  phone?: string;
  mode?: "login" | "signup";
};

const normalizePhone = (raw: string) => {
  const trimmed = raw.trim();
  if (trimmed.startsWith("+")) {
    return `+${trimmed.replace(/\D/g, "")}`;
  }
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  return trimmed;
};

export async function POST(request: Request) {
  let payload: OtpSendPayload | null = null;
  try {
    payload = (await request.json()) as OtpSendPayload;
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  const rawPhone = payload?.phone ?? "";
  const phone = normalizePhone(rawPhone);
  const mode = payload?.mode;

  if (!phone || !/^\+\d{10,15}$/.test(phone)) {
    return NextResponse.json({ message: "Invalid phone number." }, { status: 400 });
  }

  if (mode !== "login" && mode !== "signup") {
    return NextResponse.json({ message: "Invalid mode." }, { status: 400 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { message: "Service role key is missing." },
      { status: 500 }
    );
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  const { data: existingUser, error: lookupError } = await adminClient
    .from("personal")
    .select("id")
    .eq("phone", phone)
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json({ message: lookupError.message }, { status: 500 });
  }

  if (mode === "login" && !existingUser) {
    return NextResponse.json(
      { message: "User not found. Please create an account first." },
      { status: 404 }
    );
  }

  if (mode === "signup" && existingUser) {
    return NextResponse.json(
      { message: "Account already exists. Please sign in." },
      { status: 409 }
    );
  }

  const apiKey = process.env.TWOFACTOR_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { message: "2Factor API key is missing." },
      { status: 500 }
    );
  }

  const template = process.env.TWOFACTOR_TEMPLATE;
  const baseUrl = process.env.TWOFACTOR_BASE_URL ?? "https://2factor.in/API/V1";
  const url =
    `${baseUrl}/${apiKey}/SMS/${encodeURIComponent(phone)}/AUTOGEN` +
    (template ? `/${encodeURIComponent(template)}` : "");

  const response = await fetch(url, { cache: "no-store" });
  const data = await response.json().catch(() => null);

  if (!response.ok || !data || data.Status !== "Success") {
    return NextResponse.json(
      { message: data?.Details || "Failed to send OTP." },
      { status: 500 }
    );
  }

  return NextResponse.json({ sessionId: data.Details });
}
