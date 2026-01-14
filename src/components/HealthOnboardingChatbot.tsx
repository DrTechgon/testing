"use client";

import React, { useEffect, useRef, useState } from "react";

interface Profile {
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
}

interface Message {
  id: string;
  role: "bot" | "user";
  text: string;
}

type InputType = "text" | "single-select" | "date";

interface QuestionConfig {
  key: keyof Profile;
  question: string;
  inputType: InputType;
  options?: string[];
  placeholder?: string;
  required?: boolean; // first 4 required
}

const QUESTIONS: QuestionConfig[] = [
  { key: "dateOfBirth", question: "What is your date of birth?", inputType: "date", required: true },
  {
    key: "bloodGroup",
    question: "What is your blood group?",
    inputType: "single-select",
    required: true,
    options: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"],
  },
  { key: "heightCm", question: "What is your height (in cm)?", inputType: "text", required: true, placeholder: "e.g., 175" },
  { key: "weightKg", question: "What is your weight (in kg)?", inputType: "text", required: true, placeholder: "e.g., 83" },
  { key: "currentDiagnosedCondition", question: "Current diagnosed condition (if any)?", inputType: "text", placeholder: "e.g., Asthma / Diabetes / None" },
  { key: "allergies", question: "Allergies (if any)?", inputType: "text", placeholder: "e.g., Penicillin / Peanuts / None" },
  { key: "ongoingTreatments", question: "Ongoing treatments (if any)?", inputType: "text", placeholder: "e.g., Physiotherapy / None" },
  { key: "currentMedication", question: "Current medication (if any)?", inputType: "text", placeholder: "e.g., Metformin 500mg / None" },
  { key: "previousDiagnosedConditions", question: "Previous diagnosed conditions?", inputType: "text", placeholder: "e.g., Past hypertension / None" },
  { key: "pastSurgeries", question: "Past surgeries?", inputType: "text", placeholder: "e.g., Appendectomy (2018) / None" },
  { key: "childhoodIllness", question: "Childhood illnesses?", inputType: "text", placeholder: "e.g., Chickenpox / None" },
  { key: "longTermTreatments", question: "Long-term treatments (if any)?", inputType: "text", placeholder: "e.g., Thyroid medication / None" },
];

const uid = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export default function HealthOnboardingChatbot() {
  const [step, setStep] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [profile, setProfile] = useState<Profile>({
    dateOfBirth: "",
    bloodGroup: "",
    heightCm: null,
    weightKg: null,

    currentDiagnosedCondition: "",
    allergies: "",
    ongoingTreatments: "",
    currentMedication: "",

    previousDiagnosedConditions: "",
    pastSurgeries: "",
    childhoodIllness: "",
    longTermTreatments: "",
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const botTimeoutRef = useRef<number | null>(null);

  const addMessage = (role: "bot" | "user", text: string) => {
    setMessages((prev) => [...prev, { id: uid(), role, text }]);
  };

  useEffect(() => {
    if (messages.length === 0) addMessage("bot", QUESTIONS[0].question);
    return () => {
      if (botTimeoutRef.current) window.clearTimeout(botTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const currentQ = QUESTIONS[step];
  const canSkip = step >= 4;
  const isRequired = !!currentQ.required;

  const setAnswerOnProfile = (key: keyof Profile, raw: string) => {
    const trimmed = raw.trim();
    let value: any = trimmed;

    if (key === "heightCm" || key === "weightKg") {
      const n = Number(trimmed);
      value = Number.isFinite(n) ? n : null;
    }

    if (trimmed.toLowerCase() === "skip") {
      value = key === "heightCm" || key === "weightKg" ? null : "";
    }

    const next: Profile = { ...profile, [key]: value } as Profile;
    setProfile(next);
    return next;
  };

  const validateRequired = (key: keyof Profile, raw: string) => {
    const trimmed = raw.trim();
    if (!isRequired) return true;

    if (key === "dateOfBirth") return !!trimmed;
    if (key === "bloodGroup") return !!trimmed;

    if (key === "heightCm" || key === "weightKg") {
      const n = Number(trimmed);
      return Number.isFinite(n) && n > 0;
    }
    return trimmed.length > 0;
  };

  const handleNext = (answer: string) => {
    if (!validateRequired(currentQ.key, answer)) {
      addMessage("bot", "⚠️ This field is required. Please enter a valid answer to continue.");
      return;
    }

    setAnswerOnProfile(currentQ.key, answer);
    addMessage("user", answer.trim() ? answer : "Skipped");

    const nextStep = step + 1;
    if (nextStep < QUESTIONS.length) {
      setStep(nextStep);
      setInputValue("");
      botTimeoutRef.current = window.setTimeout(() => addMessage("bot", QUESTIONS[nextStep].question), 320);
    } else {
      setIsComplete(true);
      botTimeoutRef.current = window.setTimeout(() => addMessage("bot", "✅ Done. Press Save to store your profile."), 320);
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRequired && !inputValue.trim()) {
      addMessage("bot", "⚠️ This field is required. Please enter a valid answer to continue.");
      return;
    }
    if (!inputValue.trim() && !canSkip) return;
    handleNext(inputValue);
  };

  const progressPercent = Math.min(100, Math.round((step / QUESTIONS.length) * 100));

  const saveToDatabase = async () => {
    try {
      setIsSaving(true);
      setSaveError(null);

      const res = await fetch("/api/health-profile/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to save");
      }

      setIsSaved(true);
      addMessage("bot", "💾 Saved successfully!");
    } catch (e: any) {
      setSaveError(e?.message || "Something went wrong");
      addMessage("bot", "❌ Couldn’t save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
  <div style={styles.pageWrap}>
    {/* FULL PAGE BACKGROUND (below navbar) */}
    <div style={styles.fullBg} />
    <div style={styles.noiseOverlay} />

        <div style={styles.header}>
          <div>
            <div style={styles.kicker}>Health Setup</div>
            <h1 style={styles.title}>Welcome, let’s build your profile.</h1>
            <p style={styles.subtitle}>This helps Vytara organize your medical history securely.</p>
          </div>

          <span style={styles.badge}>{isSaved ? "Saved" : isComplete ? "Review" : "In Progress"}</span>
        </div>

        <div style={styles.gridLayout}>
          {/* CHAT */}
          <div style={{ ...styles.liquidCard, ...styles.chatPanel }}>
            <div style={styles.specular} />
            <div style={styles.innerRim} />

            <div style={styles.chatHeader}>
              <div style={styles.chatHeaderLeft}>
                <div style={styles.dot} />
                <div style={styles.chatHeaderTitle}>Assistant</div>
              </div>
              <div style={styles.chatHeaderRight}>Secure • Private</div>
            </div>

            <div style={styles.chatWindow} ref={scrollRef}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    ...styles.messageBubble,
                    ...(msg.role === "user" ? styles.userBubble : styles.botBubble),
                  }}
                >
                  <div style={styles.bubbleMeta}>{msg.role === "user" ? "You" : "Vytara"}</div>
                  <div>{msg.text}</div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT */}
          <div style={styles.rightPanel}>
            <div style={styles.liquidCard}>
              <div style={styles.specular} />
              <div style={styles.innerRim} />

              <div style={styles.sectionTitle}>Progress</div>
              <div style={styles.progressRow}>
                <div style={styles.progressBarBg}>
                  <div style={{ ...styles.progressBarFill, width: `${progressPercent}%` }} />
                </div>
                <div style={styles.progressPct}>{progressPercent}%</div>
              </div>
              <div style={styles.progressText}>
                Step {Math.min(step + 1, QUESTIONS.length)} of {QUESTIONS.length}
              </div>
            </div>

            {!isComplete && (
              <div style={styles.liquidCard}>
                <div style={styles.specular} />
                <div style={styles.innerRim} />

                <div style={styles.sectionTitle}>
                  Your details {isRequired ? <span style={{ opacity: 0.75 }}>(Required)</span> : null}
                </div>

                <div style={styles.questionText}>{currentQ.question}</div>

                {currentQ.inputType === "date" && (
                  <div style={styles.inputRow}>
                    <input
  style={styles.input}
  type="date"
  value={profile.dateOfBirth}
  onChange={(e) => setAnswerOnProfile("dateOfBirth", e.target.value)}
  onClick={(e) => {
    // Force calendar open on click
    (e.currentTarget as HTMLInputElement).showPicker?.();
  }}
  onFocus={(e) => {
    // Force calendar open on focus (keyboard/tab)
    (e.currentTarget as HTMLInputElement).showPicker?.();
  }}
/>

                    <button type="button" style={styles.sendButton} onClick={() => handleNext(profile.dateOfBirth)}>
                      ➤
                    </button>
                  </div>
                )}

                {currentQ.inputType === "text" && (
                  <>
                    <div style={styles.helperText}>
                      {currentQ.required ? "This field is mandatory." : "Optional — you can skip if it doesn’t apply."}
                    </div>

                    <form onSubmit={handleTextSubmit} style={styles.inputRow}>
                      <input
                        style={styles.input}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={currentQ.placeholder || "Type here..."}
                        autoFocus
                      />
                      <button type="submit" style={styles.sendButton}>
                        ➤
                      </button>
                    </form>
                  </>
                )}

                {currentQ.inputType === "single-select" && (
                  <div style={styles.quickRepliesGrid}>
                    {currentQ.options?.map((opt) => (
                      <button key={opt} onClick={() => handleNext(opt)} style={styles.chipBtn}>
                        {opt}
                      </button>
                    ))}
                  </div>
                )}

                {canSkip && (
                  <button onClick={() => handleNext("Skip")} style={styles.skipBtn}>
                    Skip for now
                  </button>
                )}
              </div>
            )}

            {isComplete && (
              <div style={styles.liquidCard}>
                <div style={styles.specular} />
                <div style={styles.innerRim} />

                <div style={styles.sectionTitle}>Save</div>

                <pre style={styles.codeBlock}>{JSON.stringify(profile, null, 2)}</pre>

                {saveError && <div style={styles.errorText}>{saveError}</div>}

                <button
                  onClick={saveToDatabase}
                  style={{ ...styles.actionButton, opacity: isSaving ? 0.7 : 1 }}
                  disabled={isSaving || isSaved}
                >
                  {isSaved ? "Saved ✅" : isSaving ? "Saving..." : "Save Profile"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    
  );
}

/**
 * Contained “liquid glass” section
 * (doesn't touch your AppLayout)
 * Mint/green palette matching your Welcome gradient:
 *  - #7FCCA3
 *  - #9AC996
 *  - #B8DDC2
 */
const styles: Record<string, React.CSSProperties> = {
  pageWrap: {
    padding: "12x 16px 28px",
  },

  section: {
    position: "relative",
    maxWidth: 1120,
    margin: "0 auto",
    borderRadius: 20,
    overflow: "hidden",
    padding: "20px 18px 18px",
  },

  fullBg: {
  position: "fixed",
  top: "64px",        // ⬅️ navbar height (adjust if yours is different)
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 0,
  background:
    "radial-gradient(1200px 600px at 10% 0%, rgba(127, 204, 163, 0.22), transparent 55%)," +
    "radial-gradient(900px 520px at 95% 12%, rgba(184, 221, 194, 0.18), transparent 58%)," +
    "radial-gradient(700px 450px at 50% 100%, rgba(154, 201, 150, 0.14), transparent 60%)," +
    "#070A12",
},


  sectionBg: {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(1100px 520px at 10% 0%, rgba(127, 204, 163, 0.20), transparent 60%)," +
      "radial-gradient(900px 520px at 92% 10%, rgba(184, 221, 194, 0.16), transparent 60%)," +
      "radial-gradient(700px 420px at 40% 115%, rgba(154, 201, 150, 0.12), transparent 60%)," +
      "rgba(5, 8, 16, 0.72)",
    border: "1px solid rgba(255,255,255,0.06)",
  },

  noiseOverlay: {
    pointerEvents: "none",
    position: "absolute",
    inset: 0,
    opacity: 0.08,
    mixBlendMode: "overlay",
    backgroundImage:
      "repeating-linear-gradient(0deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, rgba(0,0,0,0.00) 2px, rgba(0,0,0,0.00) 4px)," +
      "repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, rgba(0,0,0,0.00) 2px, rgba(0,0,0,0.00) 6px)",
    filter: "blur(0.2px)",
  },

  header: {
    position: "relative",
    zIndex: 2,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    padding: "6px 10px 10px",
  },

  kicker: {
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "rgba(234,240,255,0.75)",
    marginBottom: 8,
  },

  title: {
    margin: 0,
    fontSize: 28,
    fontWeight: 950,
    letterSpacing: -0.4,
    backgroundImage: "linear-gradient(90deg, #7FCCA3, #9AC996, #B8DDC2)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
  },

  subtitle: {
    margin: "8px 0 0",
    maxWidth: 560,
    fontSize: 13,
    color: "rgba(234,240,255,0.72)",
    lineHeight: 1.55,
  },

  badge: {
    whiteSpace: "nowrap",
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.18)",
    color: "rgba(234,240,255,0.90)",
    padding: "6px 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
    backdropFilter: "blur(18px) saturate(1.4)",
    WebkitBackdropFilter: "blur(18px) saturate(1.4)",
  },

  gridLayout: {
    position: "relative",
    zIndex: 2,
    display: "grid",
    gridTemplateColumns: "1.15fr 0.85fr",
    gap: 14,
    padding: "0 10px 10px",
  },

  liquidCard: {
    position: "relative",
    borderRadius: 18,
    padding: 14,
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))," +
      "radial-gradient(120% 140% at 10% 0%, rgba(255,255,255,0.16), rgba(255,255,255,0.00) 56%)," +
      "radial-gradient(120% 140% at 95% 10%, rgba(127,204,163,0.14), rgba(255,255,255,0.00) 58%)," +
      "radial-gradient(120% 140% at 40% 120%, rgba(154,201,150,0.14), rgba(255,255,255,0.00) 58%)",
    border: "1px solid rgba(255,255,255,0.16)",
    boxShadow: "0 22px 70px rgba(0,0,0,0.50), inset 0 1px 0 rgba(255,255,255,0.16)",
    backdropFilter: "blur(22px) saturate(1.6)",
    WebkitBackdropFilter: "blur(22px) saturate(1.6)",
    overflow: "hidden",
  },

  specular: {
    pointerEvents: "none",
    position: "absolute",
    inset: "-40% -30%",
    background:
      "radial-gradient(closest-side at 30% 30%, rgba(255,255,255,0.20), rgba(255,255,255,0.00) 60%)," +
      "linear-gradient(115deg, rgba(255,255,255,0.00) 35%, rgba(255,255,255,0.12) 45%, rgba(255,255,255,0.00) 55%)",
    transform: "rotate(-10deg)",
    opacity: 0.9,
    filter: "blur(6px)",
  },

  innerRim: {
    pointerEvents: "none",
    position: "absolute",
    inset: 0,
    borderRadius: 18,
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.18), inset 0 -14px 28px rgba(0,0,0,0.24)",
  },

  chatPanel: { display: "flex", flexDirection: "column", height: 560, padding: 0 },

  chatHeader: {
    padding: "14px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.10)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    position: "relative",
    zIndex: 2,
  },
  chatHeaderLeft: { display: "flex", alignItems: "center", gap: 10 },
  chatHeaderRight: { fontSize: 12, color: "rgba(234,240,255,0.70)" },

  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    background: "rgba(127, 204, 163, 0.95)",
    boxShadow: "0 0 0 5px rgba(127, 204, 163, 0.14)",
  },

  chatHeaderTitle: {
    fontSize: 12,
    fontWeight: 950,
    letterSpacing: 1.0,
    textTransform: "uppercase",
    color: "rgba(234,240,255,0.92)",
  },

  chatWindow: {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    padding: 16,
    position: "relative",
    zIndex: 2,
  },

  messageBubble: {
    padding: "10px 12px",
    borderRadius: 14,
    maxWidth: "84%",
    fontSize: 14,
    lineHeight: 1.45,
    border: "1px solid transparent",
  },

  botBubble: {
    alignSelf: "flex-start",
    background: "rgba(255,255,255,0.10)",
    borderColor: "rgba(255,255,255,0.14)",
    color: "rgba(234,240,255,0.92)",
  },

  userBubble: {
    alignSelf: "flex-end",
    background: "linear-gradient(135deg, rgba(127,204,163,0.92), rgba(154,201,150,0.76))",
    borderColor: "rgba(255,255,255,0.18)",
    color: "rgba(7,10,18,0.95)",
  },

  bubbleMeta: {
    fontSize: 11,
    opacity: 0.75,
    marginBottom: 4,
    fontWeight: 850,
  },

  rightPanel: { display: "flex", flexDirection: "column", gap: 12 },

  sectionTitle: {
    position: "relative",
    zIndex: 2,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "rgba(234,240,255,0.74)",
    fontWeight: 900,
    marginBottom: 10,
  },

  progressRow: {
    position: "relative",
    zIndex: 2,
    display: "flex",
    alignItems: "center",
    gap: 10,
  },

  progressPct: {
    fontSize: 12,
    fontWeight: 900,
    color: "rgba(234,240,255,0.85)",
    minWidth: 40,
    textAlign: "right",
  },

  progressBarBg: {
    flex: 1,
    height: 10,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: 999,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.14)",
  },

  progressBarFill: {
    height: "100%",
    background: "linear-gradient(90deg, rgba(127,204,163,0.95), rgba(154,201,150,0.85), rgba(184,221,194,0.95))",
    transition: "width 0.35s ease",
  },

  progressText: {
    position: "relative",
    zIndex: 2,
    marginTop: 8,
    fontSize: 12,
    color: "rgba(234,240,255,0.74)",
    textAlign: "right",
  },

  questionText: {
    position: "relative",
    zIndex: 2,
    fontSize: 15,
    fontWeight: 850,
    marginBottom: 12,
    color: "rgba(234,240,255,0.96)",
  },

  helperText: {
    position: "relative",
    zIndex: 2,
    fontSize: 12,
    color: "rgba(234,240,255,0.66)",
    marginTop: -6,
    marginBottom: 12,
  },

  inputRow: { position: "relative", zIndex: 2, display: "flex", gap: 10, alignItems: "center" },

  input: {
    flex: 1,
    padding: "12px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(0,0,0,0.18)",
    color: "rgba(234,240,255,0.92)",
    outline: "none",
    fontSize: 14,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
  },

  sendButton: {
    height: 44,
    padding: "0 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.18)",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.06))," +
      "linear-gradient(135deg, rgba(127,204,163,0.95), rgba(154,201,150,0.75))",
    color: "rgba(7,10,18,0.95)",
    cursor: "pointer",
    fontSize: 16,
    fontWeight: 900,
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
  },

  quickRepliesGrid: { position: "relative", zIndex: 2, display: "flex", flexWrap: "wrap", gap: 8 },

  chipBtn: {
    padding: "9px 12px",
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.16)",
    borderRadius: 999,
    cursor: "pointer",
    fontSize: 13,
    color: "rgba(234,240,255,0.90)",
  },

  skipBtn: {
    position: "relative",
    zIndex: 2,
    marginTop: 10,
    width: "100%",
    padding: "10px 12px",
    background: "rgba(255,255,255,0.08)",
    border: "1px dashed rgba(255,255,255,0.20)",
    borderRadius: 12,
    cursor: "pointer",
    color: "rgba(234,240,255,0.84)",
    fontWeight: 850,
  },

  actionButton: {
    position: "relative",
    zIndex: 2,
    width: "100%",
    padding: "12px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.18)",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.20), rgba(255,255,255,0.06))," +
      "linear-gradient(90deg, rgba(127,204,163,0.95), rgba(154,201,150,0.85), rgba(184,221,194,0.95))",
    color: "rgba(7,10,18,0.95)",
    cursor: "pointer",
    fontWeight: 950,
    letterSpacing: 0.4,
    boxShadow: "0 14px 40px rgba(0,0,0,0.35)",
    marginTop: 12,
  },

  codeBlock: {
    position: "relative",
    zIndex: 2,
    backgroundColor: "rgba(0,0,0,0.32)",
    color: "rgba(234,240,255,0.88)",
    padding: 12,
    borderRadius: 12,
    fontSize: 12,
    overflowX: "auto",
    margin: 0,
    border: "1px solid rgba(255,255,255,0.12)",
  },

  errorText: {
    marginTop: 10,
    color: "salmon",
    fontSize: 13,
    fontWeight: 700,
  },
};
