import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/server";

type ProfilePayload = {
  dateOfBirth: string; // YYYY-MM-DD
  bloodGroup: string;
  heightCm: number | null;
  weightKg: number | null;

  currentDiagnosedCondition: string;
  allergies: string;
  ongoingTreatments: string;
  currentMedication: string;

  previousDiagnosedConditions: string;
  pastSurgeries: string;
  childhoodIllness: string;
  longTermTreatments: string;
};

function computeAge(dobISO: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dobISO)) return null;
  const dob = new Date(dobISO + "T00:00:00");
  if (Number.isNaN(dob.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  if (age < 0 || age > 130) return null;
  return age;
}

function computeBMI(heightCm: number | null, weightKg: number | null): number | null {
  if (!heightCm || !weightKg) return null;
  if (heightCm < 50 || heightCm > 260) return null;
  if (weightKg < 10 || weightKg > 400) return null;
  const h = heightCm / 100;
  const bmi = weightKg / (h * h);
  return Math.round(bmi * 10) / 10;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ProfilePayload;

    const supabase = await supabaseServer();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Required fields (first 4 questions)
    if (!body?.dateOfBirth || !/^\d{4}-\d{2}-\d{2}$/.test(body.dateOfBirth)) {
      return NextResponse.json({ error: "DOB is required (YYYY-MM-DD)" }, { status: 400 });
    }
    if (!body?.bloodGroup || body.bloodGroup.trim().length === 0) {
      return NextResponse.json({ error: "Blood group is required" }, { status: 400 });
    }
    if (!body?.heightCm || !Number.isFinite(body.heightCm)) {
      return NextResponse.json({ error: "Height is required" }, { status: 400 });
    }
    if (!body?.weightKg || !Number.isFinite(body.weightKg)) {
      return NextResponse.json({ error: "Weight is required" }, { status: 400 });
    }

    // Backend-only computed
    const age = computeAge(body.dateOfBirth);
    const bmi = computeBMI(body.heightCm, body.weightKg);

    const payload = {
      user_id: data.user.id,
      date_of_birth: body.dateOfBirth,
      age,
      blood_group: body.bloodGroup,
      height_cm: body.heightCm,
      weight_kg: body.weightKg,
      bmi,

      current_diagnosed_condition: body.currentDiagnosedCondition || null,
      allergies: body.allergies || null,
      ongoing_treatments: body.ongoingTreatments || null,
      current_medication: body.currentMedication || null,
      previous_diagnosed_conditions: body.previousDiagnosedConditions || null,
      past_surgeries: body.pastSurgeries || null,
      childhood_illness: body.childhoodIllness || null,
      long_term_treatments: body.longTermTreatments || null,

      updated_at: new Date().toISOString(),
    };

    const { error: upsertErr } = await supabase
      .from("health_profiles")
      .upsert(payload, { onConflict: "user_id" });

    if (upsertErr) {
      return NextResponse.json({ error: upsertErr.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
