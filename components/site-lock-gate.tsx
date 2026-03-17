"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { HuntConfig } from "@/data/hunt-config";

type SiteLockGateProps = {
  config: HuntConfig;
  children: React.ReactNode;
};

const releaseDateFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "Europe/Paris"
});

export function SiteLockGate({ config, children }: SiteLockGateProps) {
  const { siteLock, logo } = config;
  const [password, setPassword] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(!siteLock.enabled);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [error, setError] = useState("");

  const isReleased = useMemo(() => Date.now() >= new Date(siteLock.releaseAtIso).getTime(), [siteLock.releaseAtIso]);

  useEffect(() => {
    if (!siteLock.enabled || isReleased) {
      setIsUnlocked(true);
      setHasHydrated(true);
      return;
    }

    const hasAccess = window.localStorage.getItem(siteLock.storageKey) === "granted";
    setIsUnlocked(hasAccess);
    setHasHydrated(true);
  }, [isReleased, siteLock.enabled, siteLock.storageKey]);

  const submitPassword = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password !== siteLock.password) {
      setError(siteLock.errorMessage);
      return;
    }

    window.localStorage.setItem(siteLock.storageKey, "granted");
    setError("");
    setIsUnlocked(true);
  };

  if (!siteLock.enabled || isUnlocked || isReleased) {
    return <>{children}</>;
  }

  if (!hasHydrated) {
    return <main className="min-h-screen bg-[#fcfbf7]" />;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fcfbf7] px-4 py-6 sm:px-6">
      <div className="street-grid absolute inset-0 opacity-40" />
      <div className="absolute left-0 top-24 h-[1px] w-32 bg-[#b91c1c]/60 md:w-56" />
      <div className="absolute right-0 top-40 h-[1px] w-24 bg-black/20 md:w-40" />

      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-[760px] items-center justify-center">
        <section className="w-full rounded-[32px] border border-black/10 bg-white/88 p-6 text-center shadow-soft backdrop-blur md:p-10">
          <div className="flex justify-center">
            <Image
              src={logo.src}
              alt={logo.alt}
              width={220}
              height={44}
              className="h-auto w-auto max-w-[180px] md:max-w-[220px]"
              priority
            />
          </div>

          <p className="mt-8 text-[11px] uppercase tracking-[0.34em] text-[#b91c1c]">
            {siteLock.heading}
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-ink md:text-6xl">
            {siteLock.title}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-black/68 md:text-base">
            {siteLock.message}
          </p>

          <div className="mx-auto mt-6 inline-flex rounded-full border border-black/10 bg-[#f5f3ec] px-5 py-3 text-xs uppercase tracking-[0.24em] text-black/55">
            {siteLock.releaseLabel} : {releaseDateFormatter.format(new Date(siteLock.releaseAtIso))}
          </div>

          <form onSubmit={submitPassword} className="mx-auto mt-8 max-w-[420px] space-y-4">
            <label htmlFor="site-password" className="block text-[11px] uppercase tracking-[0.28em] text-black/45">
              {siteLock.passwordLabel}
            </label>
            <input
              id="site-password"
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (error) {
                  setError("");
                }
              }}
              placeholder={siteLock.passwordPlaceholder}
              className="w-full rounded-[20px] border border-black/10 bg-[#f5f3ec] px-5 py-4 text-center text-base text-ink outline-none transition focus:border-[#b91c1c]"
            />
            {error ? <p className="text-sm text-[#9a3412]">{error}</p> : null}
            <button
              type="submit"
              className="w-full rounded-full bg-ink px-5 py-4 text-sm font-medium text-white transition duration-300 hover:bg-[#b91c1c]"
            >
              {siteLock.submitLabel}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
