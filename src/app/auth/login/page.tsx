// export const dynamic = 'force-dynamic';

// import LoginClient from './LoginClient';

// export default function LoginPage() {
//   return <LoginClient />;
// }
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Plasma from "@/components/Plasma";
import { supabase } from "@/lib/createClient";

/* ========================= LOGIN PAGE ========================= */

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(""));
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(0);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const formattedPhone = `+91${phone}`;

  const sendOtp = async () => {
    setError("");

    if (phone.length !== 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    setLoading(true);

    const { data: existingUser, error: lookupError } = await supabase
      .from("personal")
      .select("id")
      .eq("phone", formattedPhone)
      .maybeSingle();

    if (lookupError) {
      console.warn("Phone lookup failed; proceeding with OTP.", lookupError);
    } else if (!existingUser) {
      setLoading(false);
      setError("User not found. Please create an account first.");
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,
      options: { shouldCreateUser: false },
    });

    setLoading(false);

    if (error) {
      const lowerMessage = error.message.toLowerCase();
      if (lowerMessage.includes("signups not allowed")) {
        setError("User not found. Please create an account first.");
      } else {
        setError(error.message || "Failed to send OTP. Please check the number and try again.");
      }
      return;
    }

    setStep("otp");
    setTimer(60);
  };

  const verifyOtp = async () => {
    setError("");

    const otp = otpDigits.join("");
    if (otp.length !== 6) {
      setError("Please enter the 6-digit OTP.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token: otp,
      type: "sms",
    });

    setLoading(false);

    if (error || !data?.user) {
      setError(error?.message || "Invalid OTP. Please try again.");
      return;
    }

    router.push("/app/homepage");
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center relative bg-slate-950 overflow-hidden">
      <Plasma />

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-white/20">
          <div className="h-2 bg-gradient-to-r from-[#14b8a6] to-[#134E4A]" />

          <div className="p-8">
            <div className="flex justify-center mb-6">
              <Image
                src="/vytara-logo.png"
                alt="Vytara Logo"
                width={96}
                height={96}
                className="w-24 h-24"
                priority
              />
            </div>

            <h1 className="text-center text-[#14b8a6] text-3xl font-bold mb-1">
              Login with Phone
            </h1>
            <p className="text-center text-gray-500 mb-8 text-sm">
              {step === "phone"
                ? "We’ll send a one-time password"
                : `Enter the OTP sent to +91 ${phone}`}
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (loading) return;
                if (step === "phone") {
                  sendOtp();
                } else {
                  verifyOtp();
                }
              }}
            >
              {step === "phone" && (
                <>
                  <div className="flex mb-4">
                    <div className="flex items-center px-4 bg-gray-100 border-2 border-r-0 border-gray-100 rounded-l-xl text-gray-600 font-semibold">
                      +91
                    </div>
                    <input
                      type="tel"
                      placeholder="Phone number"
                      value={phone}
                      onChange={(e) => {
                        const digitsOnly = e.target.value.replace(/\D/g, "");
                        if (digitsOnly.length <= 10) setPhone(digitsOnly);
                      }}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-r-xl focus:border-[#14b8a6] focus:bg-white focus:outline-none transition-all text-black"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-br from-[#14b8a6] to-[#0f766e] text-white py-3.5 rounded-xl font-bold shadow-lg shadow-teal-900/20 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    {loading ? "Sending OTP..." : "Request OTP"}
                  </button>
                </>
              )}

              {step === "otp" && (
                <>
                  <div
                    className="flex items-center justify-between gap-2 mb-4"
                    onPaste={(e) => {
                      const text = e.clipboardData
                        .getData("text")
                        .replace(/\D/g, "")
                        .slice(0, 6);
                      if (!text) return;
                      e.preventDefault();
                      const next = Array(6).fill("");
                      text.split("").forEach((char, idx) => {
                        next[idx] = char;
                      });
                      setOtpDigits(next);
                      otpRefs.current[Math.min(text.length, 6) - 1]?.focus();
                    }}
                  >
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          otpRefs.current[idx] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        value={digit}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "").slice(-1);
                          const next = [...otpDigits];
                          next[idx] = value;
                          setOtpDigits(next);
                          if (value && idx < 5) {
                            otpRefs.current[idx + 1]?.focus();
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Backspace" && !otpDigits[idx] && idx > 0) {
                            otpRefs.current[idx - 1]?.focus();
                          }
                          if (e.key === "ArrowLeft" && idx > 0) {
                            otpRefs.current[idx - 1]?.focus();
                          }
                          if (e.key === "ArrowRight" && idx < 5) {
                            otpRefs.current[idx + 1]?.focus();
                          }
                        }}
                        className="w-11 h-12 text-center text-lg font-semibold bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-[#14b8a6] focus:bg-white focus:outline-none transition-all text-black"
                        aria-label={`OTP digit ${idx + 1}`}
                      />
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-br from-[#14b8a6] to-[#0f766e] text-white py-3.5 rounded-xl font-bold shadow-lg shadow-teal-900/20 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    {loading ? "Verifying..." : "Verify & Continue"}
                  </button>
                  {timer > 0 ? (
                    <p className="mt-3 text-xs text-gray-400 text-center">
                      Resend available in {timer}s
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={sendOtp}
                      className="mt-3 text-xs text-[#14b8a6] font-semibold hover:underline block mx-auto"
                    >
                      Resend OTP
                    </button>
                  )}
                </>
              )}

              {error && (
                <p className="mt-4 text-sm text-red-600 text-center">{error}</p>
              )}
            </form>

            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-500">
                Don&apos;t have an account?{" "}
                <button
                  className="text-[#14b8a6] font-bold hover:underline"
                  type="button"
                  onClick={() => router.push("/auth/signup")}
                >
                  Create Account
                </button>
              </p>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
