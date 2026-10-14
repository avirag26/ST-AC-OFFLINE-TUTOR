"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ApiError, api } from "@/lib/api";
import {
  clearSession,
  getAccessToken,
  getStoredUser,
  type AuthUser,
} from "@/lib/auth-storage";

type AssignedBatch = {
  id: string;
  name: string;
  isActive: boolean;
  classGrade: { id: string; name: string };
  students: {
    id: string;
    fullName: string;
    className: string | null;
    parentName: string;
  }[];
  studentCount: number;
};

type AssignedSession = {
  id: string;
  title: string | null;
  mode: string;
  status: string;
  subjectName: string | null;
  startsAt: string;
  endsAt: string;
  notes: string | null;
  batch: {
    id: string;
    name: string;
    className: string;
    studentCount?: number;
  } | null;
};

function formatRange(startsAt: string, endsAt: string) {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "—";
  return `${start.toLocaleString()} → ${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [batches, setBatches] = useState<AssignedBatch[]>([]);
  const [sessions, setSessions] = useState<AssignedSession[]>([]);
  const [sessionTab, setSessionTab] = useState<"upcoming" | "completed">(
    "upcoming",
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    const stored = getStoredUser();
    if (!token || !stored || stored.role !== "OFFLINE_TUTOR") {
      router.replace("/login");
      return;
    }
    setUser(stored);
    setReady(true);

    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const [batchesRes, sessionsRes] = await Promise.all([
          api.get<AssignedBatch[]>("/batches/mine"),
          api.get<AssignedSession[]>("/sessions/mine"),
        ]);
        setBatches(batchesRes.data);
        setSessions(sessionsRes.data);
      } catch (err) {
        setBatches([]);
        setSessions([]);
        setError(
          err instanceof ApiError
            ? err.message
            : "Could not load your batches and sessions.",
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await api.post("/auth/logout");
    } catch {
      // clear anyway
    } finally {
      clearSession();
      router.replace("/login");
    }
  }

  if (!ready || !user) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-surface-muted px-4">
        <p className="text-sm text-text-secondary">Checking your session…</p>
      </main>
    );
  }

  const upcoming = sessions.filter((s) => s.status === "SCHEDULED");
  const completed = sessions.filter((s) => s.status === "COMPLETED");
  const visibleSessions = sessionTab === "upcoming" ? upcoming : completed;

  return (
    <main className="min-h-dvh bg-surface-muted">
      <header className="sticky top-0 z-20 border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="text-sm font-medium text-primary">
              Straight Line Academy
            </p>
            <h1 className="text-lg font-semibold text-text">Offline Tutor</h1>
          </div>
          <Button
            variant="secondary"
            onClick={handleSignOut}
            isLoading={signingOut}
          >
            Sign out
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:py-10">
        <a href="/quizzes" className="flex min-h-14 items-center justify-between rounded-2xl border border-blue-100 bg-white px-5 py-4 font-semibold text-primary">Quizzes <span aria-hidden>→</span></a>
        <a href="/finance" className="flex min-h-14 items-center justify-between rounded-2xl border border-blue-100 bg-white px-5 py-4 font-semibold text-primary">Salary history <span aria-hidden>→</span></a>
        <a href="/exams" className="flex min-h-14 items-center justify-between rounded-2xl border border-blue-100 bg-white px-5 py-4 font-semibold text-primary shadow-sm">Exams & results <span aria-hidden>→</span></a>
        <section className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-8">
          <h2 className="text-xl font-semibold text-text">
            Welcome, {user.fullName}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">
            Your teaching day, organized. Review your batches, open a session,
            and record attendance when class is complete.
          </p>
          <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-surface-muted px-4 py-3">
              <dt className="text-text-secondary">Phone</dt>
              <dd className="mt-1 font-medium text-text">{user.phone}</dd>
            </div>
            <div className="rounded-xl border border-border bg-surface-muted px-4 py-3">
              <dt className="text-text-secondary">Email</dt>
              <dd className="mt-1 break-all font-medium text-text">
                {user.email}
              </dd>
            </div>
          </dl>
        </section>

        {error ? (
          <p className="text-sm text-error" role="alert">
            {error}
          </p>
        ) : null}

        <section className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-8">
          <h3 className="text-base font-semibold text-text">My batches</h3>
          {loading ? (
            <p className="mt-3 text-sm text-text-secondary">Loading…</p>
          ) : batches.length === 0 ? (
            <p className="mt-3 text-sm text-text-secondary">
              No batches assigned yet. The CEO will assign you to a batch.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {batches.map((batch) => (
                <article
                  key={batch.id}
                  className="rounded-xl border border-border bg-surface-muted px-4 py-3"
                >
                  <p className="font-medium text-text">
                    {batch.classGrade.name} — {batch.name}
                  </p>
                  <p className="mt-1 text-sm text-text-secondary">
                    {batch.studentCount} students
                  </p>
                  {batch.students.length > 0 ? (
                    <ul className="mt-2 space-y-1 text-sm text-text-secondary">
                      {batch.students.map((student) => (
                        <li key={student.id}>
                          {student.fullName}
                          {student.parentName
                            ? ` · Parent: ${student.parentName}`
                            : ""}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-8">
          <h3 className="text-base font-semibold text-text">My sessions</h3>
          <div
            className="mt-4 grid grid-cols-2 gap-2"
            role="tablist"
            aria-label="Session status"
          >
            {(
              [
                {
                  id: "upcoming" as const,
                  label: `Upcoming (${upcoming.length})`,
                },
                {
                  id: "completed" as const,
                  label: `Completed (${completed.length})`,
                },
              ] as const
            ).map((tab) => {
              const selected = sessionTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setSessionTab(tab.id)}
                  className={[
                    "min-h-11 rounded-xl border px-3 text-sm font-semibold",
                    selected
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-surface text-text hover:bg-surface-muted",
                  ].join(" ")}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {loading ? (
            <p className="mt-3 text-sm text-text-secondary">Loading…</p>
          ) : visibleSessions.length === 0 ? (
            <p className="mt-3 text-sm text-text-secondary">
              {sessionTab === "upcoming"
                ? "No upcoming sessions. The CEO will schedule center classes for your batches."
                : "No completed sessions yet. Sessions move here after you save attendance."}
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {visibleSessions.map((session) => (
                <article
                  key={session.id}
                  className="rounded-xl border border-border bg-surface-muted px-4 py-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-text">
                      {session.title ||
                        session.subjectName ||
                        "Offline session"}
                    </p>
                    <span
                      className={[
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        session.status === "COMPLETED"
                          ? "bg-surface-muted text-text-secondary"
                          : "bg-emerald-50 text-success",
                      ].join(" ")}
                    >
                      {session.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-text-secondary">
                    {formatRange(session.startsAt, session.endsAt)}
                  </p>
                  {session.batch ? (
                    <p className="mt-1 text-sm text-text-secondary">
                      Batch: {session.batch.className} — {session.batch.name}
                      {typeof session.batch.studentCount === "number"
                        ? ` · ${session.batch.studentCount} students`
                        : ""}
                    </p>
                  ) : null}
                  {session.status === "SCHEDULED" &&
                  session.batch &&
                  session.batch.studentCount === 0 ? (
                    <p className="mt-2 text-sm text-warning">
                      No students enrolled in this batch. Ask the CEO to enroll
                      students under Offline batches first.
                    </p>
                  ) : null}
                  <Link
                    href={`/sessions/${session.id}/attendance`}
                    className="mt-3 inline-flex min-h-10 items-center rounded-md bg-primary px-3 text-sm font-medium text-white hover:bg-primary-dark"
                  >
                    {session.status === "COMPLETED"
                      ? "View / edit attendance"
                      : "Mark attendance"}
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
