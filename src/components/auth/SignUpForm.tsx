"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { MultiSelectDropdown } from "@/components/ui/MultiSelectDropdown";
import { PasswordField } from "@/components/ui/PasswordField";
import { TextField } from "@/components/ui/TextField";
import { ApiError, api } from "@/lib/api";
import { fetchClassOptions, fetchSubjectOptions } from "@/lib/catalog";

type FieldErrors = {
  fullName?: string;
  dob?: string;
  email?: string;
  phone?: string;
  password?: string;
  classes?: string;
  subjects?: string;
};

function normalizePhone(value: string) {
  return value.replace(/[\s\-()]/g, "");
}

function validate(values: {
  fullName: string;
  dob: string;
  email: string;
  phone: string;
  password: string;
  classes: string[];
  subjects: string[];
}): FieldErrors {
  const errors: FieldErrors = {};
  const cleanedPhone = normalizePhone(values.phone);

  if (!values.fullName.trim()) errors.fullName = "Enter your full name.";
  if (!values.dob) errors.dob = "Select your date of birth.";
  if (!values.email.trim()) {
    errors.email = "Enter your email address.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }
  if (!cleanedPhone) {
    errors.phone = "Enter your phone number.";
  } else if (!/^\+?[0-9]{10,15}$/.test(cleanedPhone)) {
    errors.phone = "Enter a valid phone number (10–15 digits).";
  }
  if (!values.password) {
    errors.password = "Create a password.";
  } else if (values.password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  }
  if (values.classes.length === 0) errors.classes = "Select at least one class.";
  if (values.subjects.length === 0) {
    errors.subjects = "Select at least one subject.";
  }
  return errors;
}

type SignUpFormProps = {
  onSwitchToLogin?: () => void;
};

export function SignUpForm({ onSwitchToLogin }: SignUpFormProps) {
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [classes, setClasses] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [docsNote, setDocsNote] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [classOptions, setClassOptions] = useState<string[]>([]);
  const [subjectOptions, setSubjectOptions] = useState<string[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadCatalog() {
      setCatalogLoading(true);
      setCatalogError(null);
      try {
        const [nextClasses, nextSubjects] = await Promise.all([
          fetchClassOptions(),
          fetchSubjectOptions(),
        ]);
        if (!active) return;
        setClassOptions(nextClasses);
        setSubjectOptions(nextSubjects);
      } catch (error) {
        if (!active) return;
        setCatalogError(
          error instanceof ApiError
            ? error.message
            : "Could not load classes and subjects.",
        );
      } finally {
        if (active) setCatalogLoading(false);
      }
    }
    void loadCatalog();
    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setInfoMessage(null);
    setFormError(null);

    const nextErrors = validate({
      fullName,
      dob,
      email,
      phone,
      password,
      classes,
      subjects,
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const { data } = await api.post<{ message: string }>(
        "/auth/register/tutor",
        {
          fullName: fullName.trim(),
          dob,
          email: email.trim(),
          phone: normalizePhone(phone),
          password,
          role: "OFFLINE_TUTOR",
          subjects,
          classes,
          documentsNote: docsNote.trim() || undefined,
        },
      );
      setInfoMessage(
        data.message ||
          "Registration submitted. You can sign in after the CEO approves your account.",
      );
      setFullName("");
      setDob("");
      setEmail("");
      setPhone("");
      setPassword("");
      setClasses([]);
      setSubjects([]);
      setDocsNote("");
    } catch (error) {
      setFormError(
        error instanceof ApiError
          ? error.message
          : "Could not create your account. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-1 flex-col gap-4"
      noValidate
    >
      {formError ? (
        <div
          role="alert"
          className="rounded-md border border-error/30 bg-error-bg px-3 py-3 text-sm text-error"
        >
          {formError}
        </div>
      ) : null}

      {infoMessage ? (
        <div
          role="status"
          className="rounded-md border border-primary/20 bg-surface-muted px-3 py-3 text-sm text-text"
        >
          {infoMessage}
          {onSwitchToLogin ? (
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="mt-2 block min-h-11 text-sm font-medium text-primary"
            >
              Go to Sign in
            </button>
          ) : null}
        </div>
      ) : null}

      {catalogError ? (
        <div
          role="alert"
          className="rounded-md border border-error/30 bg-error-bg px-3 py-3 text-sm text-error"
        >
          {catalogError}
        </div>
      ) : null}

      <TextField
        name="fullName"
        label="Full name"
        autoComplete="name"
        placeholder="Your full name"
        value={fullName}
        onChange={(e) => {
          setFullName(e.target.value);
          if (errors.fullName) setErrors((c) => ({ ...c, fullName: undefined }));
        }}
        error={errors.fullName}
      />

      <TextField
        name="dob"
        label="Date of birth"
        type="date"
        value={dob}
        onChange={(e) => {
          setDob(e.target.value);
          if (errors.dob) setErrors((c) => ({ ...c, dob: undefined }));
        }}
        error={errors.dob}
      />

      <TextField
        name="email"
        label="Email"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (errors.email) setErrors((c) => ({ ...c, email: undefined }));
        }}
        error={errors.email}
        hint="Used for password reset later."
      />

      <TextField
        name="phone"
        label="Phone number"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="e.g. 9876543210"
        value={phone}
        onChange={(e) => {
          setPhone(e.target.value);
          if (errors.phone) setErrors((c) => ({ ...c, phone: undefined }));
        }}
        error={errors.phone}
        hint="You will sign in with this phone number."
      />

      <PasswordField
        name="password"
        label="Password"
        autoComplete="new-password"
        placeholder="Create a password"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          if (errors.password) setErrors((c) => ({ ...c, password: undefined }));
        }}
        error={errors.password}
      />

      <MultiSelectDropdown
        label="Classes you teach"
        options={classOptions}
        value={classes}
        onChange={(next) => {
          setClasses(next);
          if (errors.classes) setErrors((c) => ({ ...c, classes: undefined }));
        }}
        placeholder={catalogLoading ? "Loading classes…" : "Select classes"}
        hint="Managed by the CEO. Used for center / batch teaching."
        error={errors.classes}
        emptyMessage="No classes yet. Ask the CEO to add classes first."
      />

      <MultiSelectDropdown
        label="Subjects you teach"
        options={subjectOptions}
        value={subjects}
        onChange={(next) => {
          setSubjects(next);
          if (errors.subjects) setErrors((c) => ({ ...c, subjects: undefined }));
        }}
        placeholder={catalogLoading ? "Loading subjects…" : "Select subjects"}
        hint="Managed by the CEO."
        error={errors.subjects}
        emptyMessage="No subjects yet. Ask the CEO to add subjects first."
      />

      <TextField
        name="docs"
        label="Documents (optional)"
        type="text"
        placeholder="e.g. Certificate name — upload comes later"
        value={docsNote}
        onChange={(e) => setDocsNote(e.target.value)}
        hint="Optional. File upload comes later."
      />

      <div className="mt-auto pt-2">
        <Button
          type="submit"
          fullWidth
          isLoading={isSubmitting}
          disabled={catalogLoading || Boolean(catalogError)}
        >
          Create account
        </Button>
        <p className="mt-3 text-center text-xs leading-relaxed text-text-secondary">
          After you register, the CEO must approve your account before you can
          sign in.
        </p>
      </div>
    </form>
  );
}
