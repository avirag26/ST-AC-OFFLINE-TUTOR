"use client";

import { useState } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { SignUpForm } from "@/components/auth/SignUpForm";

type AuthTab = "login" | "signup";

const tabs: { id: AuthTab; label: string }[] = [
  { id: "login", label: "Sign in" },
  { id: "signup", label: "Sign up" },
];

const highlights = [
  "See batches and students assigned by the CEO",
  "Mark attendance for center classes",
  "Review upcoming and completed sessions",
];

export function AuthPanel() {
  const [activeTab, setActiveTab] = useState<AuthTab>("login");

  const subtitle =
    activeTab === "login"
      ? "Welcome back. Sign in with your phone number to continue."
      : "Create your offline tutor account. CEO approval is required before sign in.";

  return (
    <div className="flex min-h-dvh w-full flex-col bg-surface lg:grid lg:min-h-dvh lg:grid-cols-2">
      <header className="shrink-0 bg-primary px-5 pb-6 pt-[max(1.25rem,env(safe-area-inset-top))] text-white lg:hidden">
        <p className="text-sm font-medium text-white/85">Straight Line Academy</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Offline Tutor
        </h1>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/85">
          {subtitle}
        </p>
      </header>

      <aside className="relative hidden overflow-hidden bg-primary text-white lg:flex lg:flex-col lg:justify-between lg:px-12 lg:py-14 xl:px-16 xl:py-16">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          aria-hidden
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, #93c5fd 0%, transparent 42%), radial-gradient(circle at 85% 75%, #1d4ed8 0%, transparent 45%)",
          }}
        />
        <div className="relative z-10">
          <p className="text-sm font-medium tracking-wide text-white/85">
            Straight Line Academy
          </p>
          <h1 className="mt-4 max-w-lg text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
            Offline Tutor portal
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-white/90 xl:text-lg">
            Manage center batches, attendance, exams, and quizzes in one simple
            place.
          </p>
        </div>
        <ul className="relative z-10 mt-12 space-y-4">
          {highlights.map((item) => (
            <li
              key={item}
              className="flex items-start gap-3 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm leading-relaxed text-white/95 xl:text-base"
            >
              <span
                className="mt-1 inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-white"
                aria-hidden
              />
              {item}
            </li>
          ))}
        </ul>
        <p className="relative z-10 mt-10 text-sm text-white/70">
          After registration, wait for CEO approval before you can sign in.
        </p>
      </aside>

      <section className="flex min-h-0 flex-1 flex-col lg:min-h-dvh lg:overflow-y-auto lg:bg-surface-muted">
        <div className="mx-auto flex w-full max-w-xl flex-1 flex-col lg:max-w-2xl lg:px-10 lg:py-10 xl:px-14">
          <div className="mb-6 hidden lg:block">
            <h2 className="text-3xl font-semibold tracking-tight text-text">
              {activeTab === "login" ? "Sign in" : "Create account"}
            </h2>
            <p className="mt-2 text-base text-text-secondary">{subtitle}</p>
          </div>

          <div className="relative z-10 -mt-3 px-4 lg:mt-0 lg:px-0">
            <div
              role="tablist"
              aria-label="Account options"
              className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-surface-muted p-1 shadow-sm lg:bg-surface lg:shadow-none"
            >
              {tabs.map((tab) => {
                const selected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setActiveTab(tab.id)}
                    className={[
                      "min-h-11 rounded-lg px-3 text-sm font-semibold transition-colors",
                      selected
                        ? "bg-primary text-white"
                        : "bg-transparent text-text-secondary hover:text-text",
                    ].join(" ")}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-1 flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5 lg:mt-6 lg:rounded-2xl lg:border lg:border-border lg:bg-surface lg:px-8 lg:py-8 lg:shadow-[var(--shadow-card)]">
            {activeTab === "login" ? (
              <LoginForm />
            ) : (
              <SignUpForm onSwitchToLogin={() => setActiveTab("login")} />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
