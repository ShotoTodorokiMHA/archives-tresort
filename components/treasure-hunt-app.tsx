"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { HuntConfig, TreasureStep } from "@/data/hunt-config";
import { StepStatus, clsx } from "@/lib/utils";

const DynamicMap = dynamic(
  () => import("@/components/map-view").then((mod) => mod.MapView),
  {
    ssr: false,
    loading: () => (
      <div className="h-[440px] animate-pulse rounded-[28px] border border-black/10 bg-white/70 shadow-soft md:h-[620px]" />
    )
  }
);

type SharedProgress = {
  validatedStepIds: string[];
  message?: string;
  error?: string;
};

type TreasureHuntAppProps = {
  huntConfig: HuntConfig;
  treasureSteps: TreasureStep[];
};

const buildStatuses = (
  treasureSteps: TreasureStep[],
  validatedStepIds: string[]
): Record<string, StepStatus> => {
  const validatedSet = new Set(validatedStepIds);

  return treasureSteps.reduce<Record<string, StepStatus>>((acc, step) => {
    acc[step.id] = validatedSet.has(step.id) ? "validated" : "unlocked";
    return acc;
  }, {});
};

export function TreasureHuntApp({ huntConfig, treasureSteps }: TreasureHuntAppProps) {
  const [validatedStepIds, setValidatedStepIds] = useState<string[]>([]);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(treasureSteps[0]?.id ?? null);
  const [enteredCode, setEnteredCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const syncProgress = async () => {
    const response = await fetch("/api/progress", {
      cache: "no-store"
    });
    const data = (await response.json()) as SharedProgress;

    setValidatedStepIds(data.validatedStepIds ?? []);
  };

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const response = await fetch("/api/progress", {
          cache: "no-store"
        });
        const data = (await response.json()) as SharedProgress;

        if (!isMounted) {
          return;
        }

        setValidatedStepIds(data.validatedStepIds ?? []);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void load();

    const interval = window.setInterval(() => {
      void syncProgress();
    }, 5000);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const statuses = useMemo(
    () => buildStatuses(treasureSteps, validatedStepIds),
    [treasureSteps, validatedStepIds]
  );
  const selectedStep = treasureSteps.find((step) => step.id === selectedStepId) ?? treasureSteps[0];
  const completedCount = validatedStepIds.length;
  const isFinished = completedCount === treasureSteps.length;

  useEffect(() => {
    setEnteredCode("");
    setCodeError("");
  }, [selectedStepId]);

  const focusActiveStep = () => {
    setSelectedStepId(treasureSteps[0]?.id ?? null);
  };

  const validateSelectedStep = async () => {
    if (!selectedStep || statuses[selectedStep.id] !== "unlocked" || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setCodeError("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          stepId: selectedStep.id,
          code: enteredCode
        })
      });

      const data = (await response.json()) as SharedProgress;

      if (!response.ok) {
        setCodeError(data.error ?? huntConfig.codeErrorMessage);
        await syncProgress();
        return;
      }

      setValidatedStepIds(data.validatedStepIds ?? []);
      setSuccessMessage(data.message ?? huntConfig.successMessage);
      setIsSuccessModalOpen(true);
      setEnteredCode("");
    } catch {
      setCodeError("Impossible de synchroniser la progression pour le moment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative overflow-hidden">
      <div className="street-grid absolute inset-0 -z-20 opacity-50" />
      <div className="absolute inset-x-0 top-0 -z-10 h-[560px] bg-grain" />
      <div className="absolute left-0 top-24 -z-10 h-[1px] w-32 bg-[#b91c1c]/60 md:w-56" />
      <div className="absolute right-0 top-40 -z-10 h-[1px] w-24 bg-black/20 md:w-40" />
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-3 pb-8 pt-3 sm:px-6 lg:px-10">
        <section className="rounded-[28px] border border-black/10 bg-white/75 px-4 py-5 shadow-soft backdrop-blur md:rounded-[32px] md:px-10 md:py-10">
          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:gap-10">
            <div className="space-y-5 text-center md:space-y-8">
              <div className="flex justify-center">
                <div className="inline-flex min-h-12 items-center justify-center px-1 py-1 md:min-h-14">
                  <Image
                    src={huntConfig.logo.src}
                    alt={huntConfig.logo.alt}
                    width={220}
                    height={44}
                    className="h-auto w-auto max-w-[168px] md:max-w-[220px]"
                    priority
                  />
                </div>
              </div>

              <div className="mx-auto flex max-w-3xl flex-col items-center space-y-3 md:space-y-5">
                <h1 className="text-balance mx-auto max-w-3xl text-[2rem] font-semibold leading-[0.92] tracking-[-0.06em] text-ink opacity-0 animate-rise md:text-6xl">
                  {huntConfig.title}
                </h1>
                <p
                  className="text-balance mx-auto max-w-2xl text-sm leading-6 text-black/65 opacity-0 animate-rise md:text-lg md:leading-7"
                  style={{ animationDelay: "120ms" }}
                >
                  {huntConfig.subtitle}
                </p>
                <p
                  className="mx-auto hidden max-w-2xl text-sm leading-7 text-black/55 opacity-0 animate-rise md:block md:text-base"
                  style={{ animationDelay: "220ms" }}
                >
                  {huntConfig.intro}
                </p>
              </div>
            </div>

            <div
              className="rounded-[24px] border border-black/10 bg-[#f5f3ec] p-4 opacity-0 animate-rise md:rounded-[28px] md:p-6"
              style={{ animationDelay: "320ms" }}
            >
              <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-2">
                <div />
                <div className="text-center">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-black/45">Progression</p>
                  <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-ink md:mt-3 md:text-3xl">
                    {completedCount}/{treasureSteps.length}
                  </p>
                </div>
                <div className="justify-self-end rounded-full border border-black/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-black/55 md:px-4 md:py-2 md:text-xs md:tracking-[0.24em]">
                  {huntConfig.cityLabel}
                </div>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/8 md:mt-6">
                <div
                  className="h-full rounded-full bg-[#b91c1c] transition-all duration-700"
                  style={{ width: `${(completedCount / treasureSteps.length) * 100}%` }}
                />
              </div>
              <div className="mt-4 flex flex-col gap-2 md:mt-6">
                <button
                  type="button"
                  onClick={focusActiveStep}
                  className="rounded-full bg-ink px-5 py-3 text-sm font-medium text-white transition duration-300 hover:bg-[#b91c1c]"
                >
                  {huntConfig.startButtonLabel}
                </button>
              </div>
              <p className="mt-4 text-center text-xs leading-5 text-black/50">
                {isLoading
                  ? "Chargement de la progression commune..."
                  : "Toutes les boîtes sont jouables par tout le monde, en même temps."}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-4 grid gap-4 lg:mt-6 lg:grid-cols-[1.3fr_0.7fr] lg:gap-6">
          <div className="order-1 lg:order-1">
            <DynamicMap
              center={huntConfig.center}
              activeStepId={selectedStepId}
              steps={treasureSteps}
              statuses={statuses}
              onSelectStep={setSelectedStepId}
            />
          </div>

          <aside className="order-2 flex flex-col gap-4 lg:order-2">
            <div className="rounded-[24px] border border-black/10 bg-white/80 p-4 text-center shadow-soft backdrop-blur md:rounded-[28px] md:p-6">
              <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-2 md:gap-4">
                <div />
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-black/45">Boîte sélectionnée</p>
                  <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-ink md:mt-3 md:text-2xl">
                    {selectedStep.name}
                  </h2>
                </div>
                <span
                  className={clsx(
                    "justify-self-end rounded-full px-2.5 py-1.5 text-[9px] uppercase tracking-[0.18em] md:px-3 md:text-[10px] md:tracking-[0.22em]",
                    statuses[selectedStep.id] === "validated" && "bg-black text-white",
                    statuses[selectedStep.id] === "unlocked" && "bg-[#b91c1c] text-white"
                  )}
                >
                  {statuses[selectedStep.id] === "validated" ? "Validée" : "Disponible"}
                </span>
              </div>

              <p className="mt-3 text-xs uppercase tracking-[0.18em] text-black/40 md:mt-4 md:text-sm md:tracking-[0.22em]">
                {selectedStep.address}
              </p>
              <p className="mt-4 text-sm leading-6 text-black/75 md:mt-6 md:leading-7">
                {selectedStep.hint}
              </p>
              <p className="mt-3 hidden text-sm leading-7 text-black/70 md:block">{selectedStep.description}</p>

              <div className="mt-4 rounded-[20px] bg-[#f5f3ec] p-4 md:mt-6 md:rounded-[24px]">
                <p className="text-[11px] uppercase tracking-[0.28em] text-black/45">Instruction</p>
                <p className="mt-2 text-sm leading-6 text-black/80">
                  {statuses[selectedStep.id] === "validated"
                    ? "Cette boîte a déjà été validée. Vous pouvez quand même visiter les autres points."
                    : "Trouvez la boîte choisie puis entrez son code pour la valider pour tout le monde."}
                </p>
              </div>

              <div className="mt-4 rounded-[20px] border border-black/10 bg-white p-4 md:mt-6 md:rounded-[24px]">
                <label
                  htmlFor="step-code"
                  className="text-[11px] uppercase tracking-[0.28em] text-black/45"
                >
                  {huntConfig.codeInputLabel}
                </label>
                <input
                  id="step-code"
                  inputMode="numeric"
                  pattern="\d{4}"
                  maxLength={4}
                  value={enteredCode}
                  onChange={(event) => {
                    const nextValue = event.target.value.replace(/\D/g, "").slice(0, 4);
                    setEnteredCode(nextValue);
                    if (codeError) {
                      setCodeError("");
                    }
                  }}
                  disabled={statuses[selectedStep.id] === "validated" || isSubmitting}
                  placeholder={huntConfig.codeInputPlaceholder}
                  className="mt-3 w-full rounded-[16px] border border-black/10 bg-[#f5f3ec] px-4 py-3 text-center text-lg tracking-[0.35em] text-ink outline-none transition focus:border-[#b91c1c] disabled:cursor-not-allowed disabled:opacity-50 md:rounded-[18px]"
                />
                <p className="mt-3 text-xs leading-5 text-black/55 md:text-sm md:leading-6">
                  {statuses[selectedStep.id] === "validated"
                    ? "Boîte déjà validée."
                    : huntConfig.codeHelperText}
                </p>
                {codeError ? <p className="mt-2 text-sm text-[#9a3412]">{codeError}</p> : null}
              </div>

              <div className="mt-4 flex flex-col gap-2 md:mt-6">
                <button
                  type="button"
                  onClick={() => void validateSelectedStep()}
                  disabled={statuses[selectedStep.id] === "validated" || isSubmitting}
                  className="rounded-full bg-ink px-5 py-3 text-sm font-medium text-white transition duration-300 hover:bg-[#b91c1c] disabled:cursor-not-allowed disabled:bg-black/20"
                >
                  {isSubmitting ? "Validation..." : huntConfig.validateButtonLabel}
                </button>
              </div>
            </div>

            <div className="rounded-[24px] border border-black/10 bg-[#0f0f10] p-4 text-white shadow-soft md:rounded-[28px] md:p-6">
              <p className="text-center text-[11px] uppercase tracking-[0.28em] text-white/55">Parcours</p>
              <div className="mt-4 space-y-2 md:mt-5 md:space-y-3">
                {treasureSteps.map((step, index) => (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setSelectedStepId(step.id)}
                    className={clsx(
                      "flex w-full items-center justify-between rounded-[18px] border px-3 py-3 text-center transition duration-300 md:rounded-[22px] md:px-4 md:py-4",
                      selectedStepId === step.id
                        ? "border-white/30 bg-white/12"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    )}
                  >
                    <div className="flex-1">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-white/45 md:tracking-[0.22em]">
                        Etape {index + 1}
                      </p>
                      <p className="mt-1 text-sm font-medium md:mt-2">{step.name}</p>
                    </div>
                    <span className="text-xs uppercase tracking-[0.2em] text-white/60">
                      {statuses[step.id] === "validated" ? "Ok" : "Open"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </section>

        {isFinished ? (
          <section className="mt-4 rounded-[28px] border border-black/10 bg-white/85 p-5 text-center shadow-soft backdrop-blur md:mt-6 md:rounded-[32px] md:p-10">
            <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-black/45">Final</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-ink md:mt-4 md:text-5xl">
                  Toutes les boîtes ont été trouvées.
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-black/70 md:mt-5 md:text-base md:leading-7">
                  {huntConfig.finalMessage}
                </p>
              </div>
              <div className="rounded-[24px] border border-black/10 bg-[#f5f3ec] p-5 lg:min-w-[320px] md:rounded-[28px] md:p-6">
                <p className="text-[11px] uppercase tracking-[0.28em] text-black/45">Phrase vendeur</p>
                <p className="mt-3 text-lg font-semibold leading-7 text-[#b91c1c] md:mt-4 md:text-2xl">
                  {huntConfig.finalCode}
                </p>
                <p className="mt-3 text-sm leading-6 text-black/70 md:mt-4 md:leading-7">
                  {huntConfig.finalRewardHint}
                </p>
              </div>
            </div>
          </section>
        ) : null}
      </div>
      {isSuccessModalOpen && successMessage ? (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/55 px-4">
          <div className="w-full max-w-[560px] rounded-[28px] border border-[#b91c1c]/20 bg-white p-6 text-center shadow-soft md:p-8">
            <p className="text-[11px] uppercase tracking-[0.34em] text-[#b91c1c]">{huntConfig.successTitle}</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-ink md:text-4xl">
              Code validé
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-black/75 md:text-base">
              {successMessage}
            </p>
            <button
              type="button"
              onClick={() => setIsSuccessModalOpen(false)}
              className="mt-6 rounded-full bg-ink px-6 py-3 text-sm font-medium text-white transition duration-300 hover:bg-[#b91c1c]"
            >
              Fermer
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
