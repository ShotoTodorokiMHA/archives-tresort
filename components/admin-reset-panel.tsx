"use client";

import { useState } from "react";
import { huntConfig } from "@/data/hunt-config";

export function AdminResetPanel() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "reset",
          adminPassword: password
        })
      });

      const data = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        setError(data.error ?? huntConfig.admin.errorMessage);
        return;
      }

      setMessage(data.message ?? huntConfig.admin.successMessage);
      setPassword("");
    } catch {
      setError("Impossible de reinitialiser pour le moment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fcfbf7] px-4 py-6 sm:px-6">
      <div className="street-grid absolute inset-0 opacity-40" />
      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-[680px] items-center justify-center">
        <section className="w-full rounded-[32px] border border-black/10 bg-white/88 p-6 text-center shadow-soft backdrop-blur md:p-10">
          <p className="text-[11px] uppercase tracking-[0.34em] text-[#b91c1c]">Interne</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-ink md:text-5xl">
            {huntConfig.admin.title}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-black/68 md:text-base">
            {huntConfig.admin.description}
          </p>

          <form onSubmit={handleReset} className="mx-auto mt-8 max-w-[420px] space-y-4">
            <label htmlFor="admin-password" className="block text-[11px] uppercase tracking-[0.28em] text-black/45">
              {huntConfig.admin.passwordLabel}
            </label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (error) {
                  setError("");
                }
              }}
              placeholder={huntConfig.admin.passwordPlaceholder}
              className="w-full rounded-[20px] border border-black/10 bg-[#f5f3ec] px-5 py-4 text-center text-base text-ink outline-none transition focus:border-[#b91c1c]"
            />
            {error ? <p className="text-sm text-[#9a3412]">{error}</p> : null}
            {message ? <p className="text-sm text-[#166534]">{message}</p> : null}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-ink px-5 py-4 text-sm font-medium text-white transition duration-300 hover:bg-[#b91c1c] disabled:cursor-not-allowed disabled:bg-black/25"
            >
              {isSubmitting ? "Reset..." : huntConfig.admin.resetLabel}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
