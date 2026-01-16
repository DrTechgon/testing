export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "email_required" },
        { status: 400 }
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceRoleKey) {
      return NextResponse.json(
        { error: "server_not_configured" },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(url, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // 🔑 Cast params to bypass outdated TS definitions
    const { data, error } =
      await supabaseAdmin.auth.admin.listUsers({
        email: email.trim().toLowerCase(),
        perPage: 1,
      } as any);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const exists = (data?.users?.length ?? 0) > 0;

    return NextResponse.json({ exists });
  } catch (err) {
    console.error("check-user failed:", err);
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500 }
    );
  }
}
