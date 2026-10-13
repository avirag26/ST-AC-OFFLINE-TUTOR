"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ApiError, api } from "@/lib/api";
import { getAccessToken, getStoredUser } from "@/lib/auth-storage";

type AttendanceStatus = "PRESENT" | "ABSENT";

type RosterResponse = {
  session: {
    id: string;
    title: string | null;
    subjectName: string | null;
    startsAt: string;
    endsAt: string;
    status: string;
    batch: { id: string; name: string; className: string } | null;
  };
  note: string;
  emptyHelp: string | null;
  students: {
    id: string;
    fullName: string;
    className: string | null;
    parentName: string;
    status: AttendanceStatus | null;
    effectiveStatus: AttendanceStatus;
  }[];
};

function formatRange(startsAt: string, endsAt: string) {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "—";
  return `${start.toLocaleString()} → ${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

export default function AttendancePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const sessionId = params.id;

  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [roster, setRoster] = useState<RosterResponse | null>(null);
  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>({});

  useEffect(() => {
    const token = getAccessToken();
    const stored = getStoredUser();
    if (!token || !stored || stored.role !== "OFFLINE_TUTOR") {
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [router]);

  useEffect(() => {
    if (!ready || !sessionId) return;

    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get<RosterResponse>(
          `/sessions/${sessionId}/attendance`,
        );
        setRoster(data);
        const initial: Record<string, AttendanceStatus> = {};
        for (const student of data.students) {
          initial[student.id] = student.status ?? "ABSENT";
        }
        setMarks(initial);
      } catch (err) {
        setRoster(null);
        setError(
          err instanceof ApiError
            ? err.message
            : "Could not load attendance roster.",
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [ready, sessionId]);

  async function handleSave() {
    if (!roster) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        marks: roster.students.map((student) => ({
          studentId: student.id,
          status: marks[student.id] ?? "ABSENT",
        })),
      };
      const { data } = await api.put<RosterResponse>(
        `/sessions/${sessionId}/attendance`,
        payload,
      );
      setRoster(data);
      const next: Record<string, AttendanceStatus> = {};
      for (const student of data.students) {
        next[student.id] = student.status ?? "ABSENT";
      }
      setMarks(next);
      setSuccess(
        "Attendance saved. This session is now Completed — it will show under the Completed tab on your dashboard.",
      );
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not save attendance.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (!ready) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-surface-muted px-4">
        <p className="text-sm text-text-secondary">Checking your session…</p>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-surface-muted">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-sm font-medium text-primary">
              Straight Line Academy
            </p>
            <h1 className="text-lg font-semibold text-text">Attendance</h1>
          </div>
          <Link
            href="/dashboard"
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-text hover:bg-surface-muted"
          >
            Back
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-4 px-4 py-8">
        {loading ? (
          <p className="text-sm text-text-secondary">Loading roster…</p>
        ) : error && !roster ? (
          <p className="text-sm text-error" role="alert">
            {error}
          </p>
        ) : roster ? (
          <>
            <section className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
              <h2 className="text-lg font-semibold text-text">
                {roster.session.title ||
                  roster.session.subjectName ||
                  "Offline session"}
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                {formatRange(roster.session.startsAt, roster.session.endsAt)}
              </p>
              {roster.session.batch ? (
                <p className="mt-1 text-sm text-text-secondary">
                  {roster.session.batch.className} — {roster.session.batch.name}
                </p>
              ) : null}
              <p className="mt-3 rounded-md border border-primary/20 bg-surface-muted px-3 py-2 text-sm text-text-secondary">
                {roster.note}
              </p>
              {roster.session.status === "COMPLETED" ? (
                <p className="mt-2 text-sm font-medium text-success">
                  Session status: Completed (after attendance was saved).
                </p>
              ) : null}
            </section>

            {error ? (
              <p className="text-sm text-error" role="alert">
                {error}
              </p>
            ) : null}
            {success ? (
              <p className="text-sm text-success" role="status">
                {success}
              </p>
            ) : null}

            {roster.students.length === 0 ? (
              <section className="rounded-2xl border border-warning/30 bg-amber-50 p-5">
                <p className="font-semibold text-warning">No students to mark</p>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                  {roster.emptyHelp ||
                    'This batch has no enrolled students yet.'}
                </p>
                <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-text-secondary">
                  <li>CEO → Students &amp; parents → create the student</li>
                  <li>CEO → Offline batches → open this batch</li>
                  <li>Enroll the student, then refresh this page</li>
                </ol>
              </section>
            ) : (
              <section className="space-y-3">
                {roster.students.map((student) => {
                  const value = marks[student.id] ?? "ABSENT";
                  return (
                    <article
                      key={student.id}
                      className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)]"
                    >
                      <p className="font-medium text-text">{student.fullName}</p>
                      <p className="mt-0.5 text-sm text-text-secondary">
                        Parent: {student.parentName}
                      </p>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setMarks((c) => ({
                              ...c,
                              [student.id]: "PRESENT",
                            }))
                          }
                          className={[
                            "min-h-11 rounded-xl border text-sm font-semibold",
                            value === "PRESENT"
                              ? "border-success bg-emerald-50 text-success"
                              : "border-border bg-surface text-text-secondary",
                          ].join(" ")}
                        >
                          Present
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setMarks((c) => ({
                              ...c,
                              [student.id]: "ABSENT",
                            }))
                          }
                          className={[
                            "min-h-11 rounded-xl border text-sm font-semibold",
                            value === "ABSENT"
                              ? "border-error bg-error-bg text-error"
                              : "border-border bg-surface text-text-secondary",
                          ].join(" ")}
                        >
                          Absent
                        </button>
                      </div>
                    </article>
                  );
                })}

                <Button fullWidth onClick={handleSave} isLoading={saving}>
                  Save attendance
                </Button>
              </section>
            )}
          </>
        ) : null}
      </div>
    </main>
  );
}
