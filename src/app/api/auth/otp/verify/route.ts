import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseJwt } from "@/lib/supabaseJwt";

export const runtime = "nodejs";

type OtpVerifyPayload = {
  phone?: string;
  otp?: string;
  sessionId?: string;
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
  let payload: OtpVerifyPayload | null = null;
  try {
    payload = (await request.json()) as OtpVerifyPayload;
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  const rawPhone = payload?.phone ?? "";
  const phone = normalizePhone(rawPhone);
  const otp = payload?.otp?.trim() ?? "";
  const sessionId = payload?.sessionId?.trim() ?? "";
  const mode = payload?.mode;

  if (!phone || !/^\+\d{10,15}$/.test(phone)) {
    return NextResponse.json({ message: "Invalid phone number." }, { status: 400 });
  }

  if (!otp || !/^\d{4,8}$/.test(otp)) {
    return NextResponse.json({ message: "Invalid OTP." }, { status: 400 });
  }

  if (!sessionId) {
    return NextResponse.json({ message: "OTP session is missing." }, { status: 400 });
  }

  if (mode !== "login" && mode !== "signup") {
    return NextResponse.json({ message: "Invalid mode." }, { status: 400 });
  }

  const apiKey = process.env.TWOFACTOR_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { message: "2Factor API key is missing." },
      { status: 500 }
    );
  }

  const baseUrl = process.env.TWOFACTOR_BASE_URL ?? "https://2factor.in/API/V1";
  const verifyUrl = `${baseUrl}/${apiKey}/SMS/VERIFY/${encodeURIComponent(
    sessionId
  )}/${encodeURIComponent(otp)}`;

  const verifyResponse = await fetch(verifyUrl, { cache: "no-store" });
  const verifyData = await verifyResponse.json().catch(() => null);

  if (!verifyResponse.ok || !verifyData || verifyData.Status !== "Success") {
    return NextResponse.json(
      { message: verifyData?.Details || "OTP verification failed." },
      { status: 400 }
    );
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

  let userId = existingUser?.id as string | undefined;

  if (!userId) {
    const { data: created, error: createError } =
      await adminClient.auth.admin.createUser({
        phone,
        phone_confirm: true,
      });

    if (createError || !created?.user?.id) {
      return NextResponse.json(
        { message: createError?.message || "Failed to create user." },
        { status: 500 }
      );
    }

    userId = created.user.id;

    await adminClient
      .from("personal")
      .upsert({ id: userId, phone }, { onConflict: "id" });
  } else {
    const { data: authUser, error: authError } =
      await adminClient.auth.admin.getUserById(userId);

    if (authError || !authUser?.user) {
      return NextResponse.json(
        {
          message:
            "Auth record is missing for this user. Please contact support.",
        },
        { status: 500 }
      );
    }
  }

  const jwtSecret = process.env.SUPABASE_JWT_SECRET;
  if (!jwtSecret) {
    return NextResponse.json(
      { message: "Supabase JWT secret is missing." },
      { status: 500 }
    );
  }

  const jwtIssuer = process.env.SUPABASE_JWT_ISSUER || "supabase";

  const expiresInSeconds = Number.parseInt(
    process.env.SUPABASE_JWT_EXPIRES_IN_SECONDS || "",
    10
  );
  const ttl = Number.isFinite(expiresInSeconds) && expiresInSeconds > 0
    ? expiresInSeconds
    : 60 * 60 * 24 * 30;

  const { token, expiresAt } = createSupabaseJwt({
    userId,
    phone,
    issuer: jwtIssuer,
    secret: jwtSecret,
    expiresInSeconds: ttl,
  });

  return NextResponse.json({
    access_token: token,
    refresh_token: "no-refresh",
    expires_at: expiresAt,
    expires_in: ttl,
    token_type: "bearer",
    user: { id: userId, phone },
  });
}
