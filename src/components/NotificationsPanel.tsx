//NotificationPanel.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, X } from "lucide-react";
import { supabase } from "@/lib/createClient";

type CareCircleInvite = {
  id: string;
  name: string;
  createdAt: string;
};

type Appointment = {
  id: string;
  date: string;
  time: string;
  title: string;
  type: string;
};

type FamilyRole = "owner" | "member";

type FamilyJoinRequestNotification = {
  id: string;
  requestId: string;
  requesterId: string;
  requesterName: string;
  createdAt: string;
};

type FamilyAcceptanceNotification = {
  id: string;
  familyId: string;
  familyName: string;
  createdAt?: string;
};

type FamilyAppointmentNotification = {
  id: string;
  memberId: string;
  memberName: string;
  appointment: Appointment;
  dateTime: Date;
};

type FamilyVaultFile = {
  name: string;
  created_at: string | null;
  folder: "reports" | "prescriptions" | "insurance" | "bills";
};

type FamilyVaultNotification = {
  id: string;
  memberId: string;
  memberName: string;
  fileName: string;
  createdAt: string;
  folder: FamilyVaultFile["folder"];
};

type FamilyMedicationNotification = {
  id: string;
  memberId: string;
  memberName: string;
  medicationName: string;
  startDate: string;
};

type FamilyMemberDetailsResponse = {
  personal?: { display_name?: string | null } | null;
  appointments?: Appointment[];
  medications?: Array<{
    id?: string;
    name?: string;
    startDate?: string;
  }>;
};

type NotificationsPanelProps = {
  userId: string;
  appointments: Appointment[];
  variant?: "desktop" | "modal";
};

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const ACCEPTED_NOTIFICATION_TTL_MS = 7 * ONE_DAY_MS;
const dismissedInvitesKey = (userId: string) => `vytara:dismissed-invites:${userId}`;
const dismissedAppointmentsKey = (userId: string) => `vytara:dismissed-appointments:${userId}`;
const dismissedFamilyNotificationsKey = (userId: string) =>
  `vytara:dismissed-family-notifications:${userId}`;
const vaultFolderLabels: Record<FamilyVaultFile["folder"], string> = {
  reports: "Lab report",
  prescriptions: "Prescription",
  insurance: "Insurance",
  bills: "Bill",
};

const parseAppointmentDateTime = (appointment: Appointment) => {
  const parsed = new Date(`${appointment.date}T${appointment.time}`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

export function NotificationsPanel({
  userId,
  appointments,
  variant = "desktop",
}: NotificationsPanelProps) {
  const router = useRouter();
  const [careCircleInvites, setCareCircleInvites] = useState<CareCircleInvite[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");
  const [familyNotificationsLoading, setFamilyNotificationsLoading] = useState(false);
  const [familyNotificationsError, setFamilyNotificationsError] = useState("");
  const [now, setNow] = useState(() => new Date());
  const [dismissedInviteIds, setDismissedInviteIds] = useState<Set<string>>(() => new Set());
  const [dismissedAppointmentIds, setDismissedAppointmentIds] = useState<Set<string>>(() => new Set());
  const [showMobileNotifications, setShowMobileNotifications] = useState(false);

  useEffect(() => {
    if (!userId || typeof window === "undefined") return;
    try {
      const storedInvites = window.localStorage.getItem(dismissedInvitesKey(userId));
      const storedAppointments = window.localStorage.getItem(dismissedAppointmentsKey(userId));
      const storedFamilyNotifications = window.localStorage.getItem(
        dismissedFamilyNotificationsKey(userId)
      );
      if (storedInvites) {
        const parsed = JSON.parse(storedInvites) as string[];
        setDismissedInviteIds(new Set(parsed));
      } else {
        setDismissedInviteIds(new Set());
      }
      if (storedAppointments) {
        const parsed = JSON.parse(storedAppointments) as string[];
        setDismissedAppointmentIds(new Set(parsed));
      } else {
        setDismissedAppointmentIds(new Set());
      }
      if (storedFamilyNotifications) {
        const parsed = JSON.parse(storedFamilyNotifications) as string[];
        setDismissedFamilyNotificationIds(new Set(parsed));
      } else {
        setDismissedFamilyNotificationIds(new Set());
      }
    } catch {
      setDismissedInviteIds(new Set());
      setDismissedAppointmentIds(new Set());
      setDismissedFamilyNotificationIds(new Set());
    }
  }, [userId]);

  useEffect(() => {
    if (!userId || typeof window === "undefined") return;
    window.localStorage.setItem(
      dismissedInvitesKey(userId),
      JSON.stringify(Array.from(dismissedInviteIds))
    );
  }, [dismissedInviteIds, userId]);

  useEffect(() => {
    if (!userId || typeof window === "undefined") return;
    window.localStorage.setItem(
      dismissedAppointmentsKey(userId),
      JSON.stringify(Array.from(dismissedAppointmentIds))
    );
  }, [dismissedAppointmentIds, userId]);

  useEffect(() => {
    if (!userId || typeof window === "undefined") return;
    window.localStorage.setItem(
      dismissedFamilyNotificationsKey(userId),
      JSON.stringify(Array.from(dismissedFamilyNotificationIds))
    );
  }, [dismissedFamilyNotificationIds, userId]);

  useEffect(() => {
    if (!userId) return;
    let isActive = true;

    const fetchInvites = async () => {
      setNotificationsLoading(true);
      setNotificationsError("");
      try {
        const response = await fetch("/api/care-circle/links", {
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error("Unable to load invites.");
        }
        const data: {
          incoming?: Array<{
            id: string;
            status: string;
            displayName: string;
            createdAt: string;
          }>;
        } = await response.json();

        if (!isActive) return;
        const pendingIncoming =
          data.incoming
            ?.filter((invite) => invite.status === "pending")
            .map((invite) => ({
              id: invite.id,
              name: invite.displayName,
              createdAt: invite.createdAt,
            })) ?? [];

        setCareCircleInvites(pendingIncoming);
      } catch {
        if (!isActive) return;
        setNotificationsError("Unable to load notifications.");
        setCareCircleInvites([]);
      } finally {
        if (isActive) {
          setNotificationsLoading(false);
        }
      }
    };

    fetchInvites();
    const interval = setInterval(fetchInvites, 60_000);

    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    let isActive = true;

    const fetchFamilyNotifications = async () => {
      setFamilyNotificationsLoading(true);
      setFamilyNotificationsError("");
      try {
        const nowTime = Date.now();
        const { data: memberRow, error: memberError } = await supabase
          .from("family_members")
          .select("family_id, role")
          .eq("user_id", userId)
          .maybeSingle();

        if (memberError && memberError.code !== "PGRST116") {
          throw memberError;
        }

        if (!memberRow?.family_id) {
          if (!isActive) return;
          setFamilyJoinRequests([]);
          setFamilyAcceptance(null);
          setFamilyAppointments([]);
          setFamilyVaultUpdates([]);
          setFamilyMedicationStarts([]);
          return;
        }

        const familyId = memberRow.family_id as string;
        const role = (memberRow.role || "member") as FamilyRole;

        const { data: familyRow } = await supabase
          .from("families")
          .select("name")
          .eq("id", familyId)
          .maybeSingle();
        const familyName = familyRow?.name?.trim() || "your family";

        const { data: memberRows, error: membersError } = await supabase
          .from("family_members")
          .select("user_id, role")
          .eq("family_id", familyId);

        if (membersError) throw membersError;

        const memberIds = (memberRows ?? [])
          .map((row: { user_id: string }) => row.user_id)
          .filter(Boolean);

        const { data: personalRows } = memberIds.length
          ? await supabase.from("personal").select("id, display_name").in("id", memberIds)
          : { data: [] as Array<{ id: string; display_name: string | null }> };

        const nameMap = new Map<string, string>();
        (personalRows ?? []).forEach((row: { id: string; display_name: string | null }) => {
          const name = row.display_name?.trim() || "Member";
          nameMap.set(row.id, name);
        });

        let joinRequestNotifications: FamilyJoinRequestNotification[] = [];
        if (role === "owner") {
          const cutoff = new Date(nowTime - ONE_DAY_MS).toISOString();
          const { data: requestRows, error: requestError } = await supabase
            .from("family_join_requests")
            .select("id, requester_id, status, created_at")
            .eq("family_id", familyId)
            .eq("status", "pending")
            .gte("created_at", cutoff)
            .order("created_at", { ascending: true });

          if (requestError) throw requestError;

          const requesterIds = (requestRows ?? []).map(
            (row: { requester_id: string }) => row.requester_id
          );
          const missingRequesterIds = requesterIds.filter((id) => !nameMap.has(id));
          if (missingRequesterIds.length > 0) {
            const { data: requesterRows } = await supabase
              .from("personal")
              .select("id, display_name")
              .in("id", missingRequesterIds);
            (requesterRows ?? []).forEach((row: { id: string; display_name: string | null }) => {
              const name = row.display_name?.trim() || "Member";
              nameMap.set(row.id, name);
            });
          }

          joinRequestNotifications = (requestRows ?? []).map(
            (row: { id: string; requester_id: string; created_at: string }) => ({
              id: `family-join:${row.id}`,
              requestId: row.id,
              requesterId: row.requester_id,
              requesterName: nameMap.get(row.requester_id) || "Member",
              createdAt: row.created_at,
            })
          );
        }

        let acceptanceNotification: FamilyAcceptanceNotification | null = null;
        if (role !== "owner") {
          const cutoff = new Date(nowTime - ACCEPTED_NOTIFICATION_TTL_MS).toISOString();
          const { data: approvedRow } = await supabase
            .from("family_join_requests")
            .select("id, status, created_at")
            .eq("requester_id", userId)
            .eq("family_id", familyId)
            .eq("status", "approved")
            .gte("created_at", cutoff)
            .order("created_at", { ascending: false })
            .maybeSingle();

          acceptanceNotification = {
            id: `family-accepted:${familyId}`,
            familyId,
            familyName,
            createdAt: approvedRow?.created_at,
          };
        }

        const otherMemberIds = memberIds.filter((id) => id && id !== userId);

        const appointmentNotifications: FamilyAppointmentNotification[] = [];
        const medicationNotifications: FamilyMedicationNotification[] = [];
        const vaultNotifications: FamilyVaultNotification[] = [];

        if (otherMemberIds.length > 0) {
          const detailResults = await Promise.all(
            otherMemberIds.map(async (memberId) => {
              try {
                const response = await fetch(
                  `/api/family/member/details?memberId=${encodeURIComponent(memberId)}`,
                  { cache: "no-store" }
                );
                if (!response.ok) return null;
                const data = (await response.json()) as FamilyMemberDetailsResponse;
                return { memberId, data };
              } catch {
                return null;
              }
            })
          );

          detailResults.forEach((result) => {
            if (!result?.data) return;
            const memberName =
              nameMap.get(result.memberId) ||
              result.data.personal?.display_name?.trim() ||
              "Member";
            const memberAppointments = Array.isArray(result.data.appointments)
              ? result.data.appointments
              : [];
            memberAppointments.forEach((appointment) => {
              const appointmentDate =
                typeof appointment.date === "string" ? appointment.date : "";
              const appointmentTime =
                typeof appointment.time === "string" ? appointment.time : "";
              if (!appointmentDate || !appointmentTime) return;
              const appointmentId =
                typeof appointment.id === "string" && appointment.id.trim()
                  ? appointment.id
                  : `${appointmentDate}-${appointmentTime}-${appointment.title || appointment.type || "appointment"}`;
              const normalizedAppointment: Appointment = {
                id: appointmentId,
                date: appointmentDate,
                time: appointmentTime,
                title: appointment.title || "",
                type: appointment.type || "Appointment",
              };
              const dateTime = parseAppointmentDateTime(normalizedAppointment);
              if (!dateTime) return;
              const diffMs = dateTime.getTime() - nowTime;
              if (diffMs <= 0 || diffMs > ONE_DAY_MS) return;
              appointmentNotifications.push({
                id: `family-appointment:${result.memberId}:${appointmentId}`,
                memberId: result.memberId,
                memberName,
                appointment: normalizedAppointment,
                dateTime,
              });
            });

            const memberMedications = Array.isArray(result.data.medications)
              ? result.data.medications
              : [];
            memberMedications.forEach((medication) => {
              const name =
                typeof medication.name === "string" ? medication.name.trim() : "";
              const startDate =
                typeof medication.startDate === "string" ? medication.startDate.trim() : "";
              if (!name || !startDate) return;
              const start = new Date(`${startDate}T00:00:00`);
              if (Number.isNaN(start.getTime())) return;
              const diffMs = nowTime - start.getTime();
              if (diffMs < 0 || diffMs > ONE_DAY_MS) return;
              const medicationId =
                typeof medication.id === "string" && medication.id.trim()
                  ? medication.id
                  : name;
              medicationNotifications.push({
                id: `family-medication:${result.memberId}:${medicationId}:${startDate}`,
                memberId: result.memberId,
                memberName,
                medicationName: name,
                startDate,
              });
            });
          });

          const sinceIso = new Date(nowTime - ONE_DAY_MS).toISOString();
          const vaultResults = await Promise.all(
            otherMemberIds.map(async (memberId) => {
              try {
                const response = await fetch(
                  `/api/family/member/vault?memberId=${encodeURIComponent(
                    memberId
                  )}&category=all&limit=5&includeSigned=0&since=${encodeURIComponent(sinceIso)}`,
                  { cache: "no-store" }
                );
                if (!response.ok) return null;
                const data = (await response.json()) as { files?: FamilyVaultFile[] };
                return { memberId, files: data.files ?? [] };
              } catch {
                return null;
              }
            })
          );

          vaultResults.forEach((result) => {
            if (!result?.files?.length) return;
            const memberName = nameMap.get(result.memberId) || "Member";
            result.files.forEach((file) => {
              if (!file?.created_at) return;
              const createdAt = file.created_at;
              const createdTime = new Date(createdAt).getTime();
              if (Number.isNaN(createdTime)) return;
              if (nowTime - createdTime > ONE_DAY_MS) return;
              vaultNotifications.push({
                id: `family-vault:${result.memberId}:${file.folder}:${file.name}:${createdAt}`,
                memberId: result.memberId,
                memberName,
                fileName: file.name,
                createdAt,
                folder: file.folder,
              });
            });
          });
        }

        appointmentNotifications.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
        vaultNotifications.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        medicationNotifications.sort(
          (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        );

        if (!isActive) return;
        setFamilyJoinRequests(joinRequestNotifications);
        setFamilyAcceptance(acceptanceNotification);
        setFamilyAppointments(appointmentNotifications);
        setFamilyVaultUpdates(vaultNotifications);
        setFamilyMedicationStarts(medicationNotifications);
      } catch (error) {
        if (!isActive) return;
        setFamilyNotificationsError("Unable to load family notifications.");
        setFamilyJoinRequests([]);
        setFamilyAcceptance(null);
        setFamilyAppointments([]);
        setFamilyVaultUpdates([]);
        setFamilyMedicationStarts([]);
      } finally {
        if (isActive) {
          setFamilyNotificationsLoading(false);
        }
      }
    };

    fetchFamilyNotifications();
    const interval = setInterval(fetchFamilyNotifications, 120_000);

    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, [userId]);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const formatRelativeTimestamp = (value: string) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "Just now";

    const now = new Date();
    const diffMs = now.getTime() - parsed.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;

    return parsed.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const formatTimeUntil = (target: Date) => {
    const diffMs = target.getTime() - now.getTime();
    if (diffMs <= 0) return "Starting now";
    const diffMinutes = Math.floor(diffMs / 60_000);
    if (diffMinutes < 60) return `In ${diffMinutes}m`;
    const diffHours = Math.floor(diffMinutes / 60);
    return `In ${diffHours}h`;
  };

  const dismissInvite = (id: string) => {
    setDismissedInviteIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const dismissAppointment = (id: string) => {
    setDismissedAppointmentIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const dismissFamilyNotification = (id: string) => {
    setDismissedFamilyNotificationIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const formatStartDate = (value: string) => {
    const parsed = new Date(`${value}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const upcomingAppointments = appointments
    .map((appointment) => {
      const dateTime = parseAppointmentDateTime(appointment);
      if (!dateTime) return null;
      const diffMs = dateTime.getTime() - now.getTime();
      if (diffMs <= 0 || diffMs > ONE_DAY_MS) return null;
      return { appointment, dateTime, diffMs };
    })
    .filter((item): item is { appointment: Appointment; dateTime: Date; diffMs: number } => Boolean(item))
    .filter(({ appointment }) => !dismissedAppointmentIds.has(appointment.id))
    .sort((a, b) => a.diffMs - b.diffMs);

  const visibleCareCircleInvites = careCircleInvites.filter((invite) => !dismissedInviteIds.has(invite.id));
  const visibleFamilyJoinRequests = familyJoinRequests.filter(
    (request) => !dismissedFamilyNotificationIds.has(request.id)
  );
  const visibleFamilyAcceptance =
    familyAcceptance && !dismissedFamilyNotificationIds.has(familyAcceptance.id)
      ? [familyAcceptance]
      : [];
  const visibleFamilyAppointments = familyAppointments
    .filter(({ dateTime }) => {
      const diffMs = dateTime.getTime() - now.getTime();
      return diffMs > 0 && diffMs <= ONE_DAY_MS;
    })
    .filter(({ id }) => !dismissedFamilyNotificationIds.has(id));
  const visibleFamilyVaultUpdates = familyVaultUpdates.filter((file) => {
    if (!file.createdAt) return false;
    const createdTime = new Date(file.createdAt).getTime();
    if (Number.isNaN(createdTime)) return false;
    if (Date.now() - createdTime > ONE_DAY_MS) return false;
    return !dismissedFamilyNotificationIds.has(file.id);
  });
  const visibleFamilyMedicationStarts = familyMedicationStarts.filter((medication) => {
    const start = new Date(`${medication.startDate}T00:00:00`);
    if (Number.isNaN(start.getTime())) return false;
    const diffMs = Date.now() - start.getTime();
    if (diffMs < 0 || diffMs > ONE_DAY_MS) return false;
    return !dismissedFamilyNotificationIds.has(medication.id);
  });
  const totalNotifications =
    visibleCareCircleInvites.length +
    upcomingAppointments.length +
    visibleFamilyJoinRequests.length +
    visibleFamilyAcceptance.length +
    visibleFamilyAppointments.length +
    visibleFamilyVaultUpdates.length +
    visibleFamilyMedicationStarts.length;
  const isLoading = notificationsLoading || familyNotificationsLoading;
  const notificationError = notificationsError || familyNotificationsError;
  const wrapperClassName =
    variant === "modal" ? "flex justify-center" : "hidden lg:flex justify-end";
  const panelClassName =
    variant === "modal"
      ? "w-full max-w-md h-[420px]"
      : "w-full max-w-sm h-[420px]";

  const NotificationContent = () => (
    <>
      {notificationsLoading && totalNotifications === 0 ? (
        <div className="flex-1 flex items-center justify-center px-6 py-4 text-sm text-slate-500">
          Checking for updates...
        </div>
      ) : notificationsError && totalNotifications === 0 ? (
        <div className="flex-1 flex items-center justify-center px-6 py-4 text-sm text-rose-600">
          {notificationsError}
        </div>
      ) : totalNotifications === 0 ? (
        <div className="flex-1 flex items-center justify-center px-6 py-4 text-sm text-slate-500">
          No notifications yet
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {upcomingAppointments.map(({ appointment, dateTime }) => (
            <button
              key={`appointment-${appointment.id}`}
              type="button"
              onClick={() => {
                setShowMobileNotifications(false);
                router.push("/app/homepage");
              }}
              className="group relative w-full rounded-2xl border border-slate-100 bg-amber-50/80 p-3 text-left transition hover:bg-white hover:shadow-sm"
            >
              <span className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-transparent transition group-hover:ring-amber-100" />
              <span className="absolute right-2 top-2">
                <span className="inline-flex rounded-full">
                  <span
                    role="button"
                    aria-label="Dismiss appointment notification"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      dismissAppointment(appointment.id);
                    }}
                    className="pointer-events-auto inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-400 opacity-0 transition hover:bg-white hover:text-slate-600 group-hover:opacity-100"
                  >
                    <X size={14} />
                  </span>
                </span>
              </span>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Upcoming appointment</p>
                  <p className="text-xs text-slate-600">
                    {appointment.title || appointment.type} · {dateTime.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                  </p>
                </div>
                <span className="text-[11px] text-slate-500">{formatTimeUntil(dateTime)}</span>
              </div>
            </button>
          ))}
          {visibleCareCircleInvites.map((invite) => (
            <button
              key={invite.id}
              type="button"
              onClick={() => {
                setShowMobileNotifications(false);
                router.push("/app/carecircle?open=incoming-invites");
              }}
              className="group relative w-full rounded-2xl border border-slate-100 bg-slate-50/80 p-3 text-left transition hover:bg-white hover:shadow-sm"
            >
              <span className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-transparent transition group-hover:ring-slate-100" />
              <span className="absolute right-2 top-2">
                <span className="inline-flex rounded-full">
                  <span
                    role="button"
                    aria-label="Dismiss care circle invite notification"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      dismissInvite(invite.id);
                    }}
                    className="pointer-events-auto inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-400 opacity-0 transition hover:bg-white hover:text-slate-600 group-hover:opacity-100"
                  >
                    <X size={14} />
                  </span>
                </span>
              </span>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Care circle invite</p>
                  <p className="text-xs text-slate-500">From {invite.name}</p>
                </div>
                <span className="text-[11px] text-slate-400">{formatInviteTimestamp(invite.createdAt)}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Mobile Notification Button - First in button row */}
      <button
        type="button"
        onClick={() => setShowMobileNotifications(true)}
        className="lg:hidden relative flex items-center justify-center gap-2 px-8 py-4 rounded-3xl bg-teal-100 hover:bg-teal-200 transition shadow-sm"
        aria-label="Open notifications"
      >
        <Bell size={22} className="text-teal-700" />
        <span className="text-base font-semibold text-teal-700">Notifications</span>
        {totalNotifications > 0 && (
          <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-teal-600 text-[11px] font-bold text-white">
            {totalNotifications > 9 ? "9+" : totalNotifications}
          </span>
        )}
      </button>

      {/* Mobile Notifications Modal */}
      {showMobileNotifications && (
        <div className="lg:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowMobileNotifications(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-x-4 top-4 bottom-4 bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                  <Bell size={18} className="text-teal-600" />
                </div>
                <h3 className="font-bold text-lg">Notifications</h3>
                {totalNotifications > 0 && (
                  <span className="rounded-full bg-teal-100 px-2.5 py-1 text-xs font-semibold text-teal-700">
                    {totalNotifications} new
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowMobileNotifications(false)}
                className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                aria-label="Close notifications"
              >
                <X size={20} />
              </button>
            </div>
            <NotificationContent />
          </div>
        </div>
      )}

      {/* Desktop Notification Panel */}
      <div className="hidden lg:flex justify-end">
        <div className="bg-white rounded-3xl shadow-lg transition border w-full max-w-sm h-[420px] flex flex-col">
          <div className="flex items-center gap-3 px-6 py-5 border-b">
            <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
              <Bell size={18} className="text-teal-600" />
            </div>
            <h3 className="font-bold text-lg">Notifications</h3>
            {totalNotifications > 0 && (
              <span className="ml-auto rounded-full bg-teal-100 px-2.5 py-1 text-xs font-semibold text-teal-700">
                {totalNotifications} new
              </span>
            )}
          </div>
          <NotificationContent />
        </div>
      </div>
    </>
  );
}