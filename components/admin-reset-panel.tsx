"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { HuntContent, TreasureStep } from "@/data/hunt-config";
import { StepStatus } from "@/lib/utils";

type ContentResponse = HuntContent & {
  message?: string;
  error?: string;
};

const DynamicMap = dynamic(
  () => import("@/components/map-view").then((mod) => mod.MapView),
  {
    ssr: false,
    loading: () => (
      <div className="h-[320px] animate-pulse rounded-[24px] border border-black/10 bg-white/70 shadow-soft" />
    )
  }
);

type StepDraftExtras = {
  mapsUrl: string;
};

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatValidationCodes(codes: string[]) {
  return codes.join("\n");
}

function parseValidationCodes(rawValue: string) {
  return rawValue
    .split("\n")
    .map((code) => code.replace(/\D/g, "").slice(0, 4))
    .filter(Boolean);
}

function extractCoordinatesFromMapsUrl(rawUrl: string) {
  const value = rawUrl.trim();

  if (!value) {
    return null;
  }

  const patterns = [
    /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /[?&]q=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /[?&]query=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
    /ll=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/
  ];

  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (!match) {
      continue;
    }

    return {
      lat: Number(match[1]),
      lng: Number(match[2])
    };
  }

  return null;
}

export function AdminResetPanel() {
  const [content, setContent] = useState<HuntContent | null>(null);
  const [adminPassword, setAdminPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [stepExtras, setStepExtras] = useState<StepDraftExtras[]>([]);

  useEffect(() => {
    const load = async () => {
      const response = await fetch("/api/hunt-content", {
        cache: "no-store"
      });
      const data = (await response.json()) as HuntContent;
      setContent(data);
      setStepExtras(data.treasureSteps.map(() => ({ mapsUrl: "" })));
    };

    void load();
  }, []);

  if (!content) {
    return <main className="min-h-screen bg-[#fcfbf7]" />;
  }

  const { huntConfig, treasureSteps } = content;
  const previewStatuses = treasureSteps.reduce<Record<string, StepStatus>>((acc, step) => {
    acc[step.id] = "unlocked";
    return acc;
  }, {});

  const updateConfig = (key: keyof typeof huntConfig, value: unknown) => {
    setContent((current) =>
      current
        ? {
            ...current,
            huntConfig: {
              ...current.huntConfig,
              [key]: value
            }
          }
        : current
    );
  };

  const updateStep = (index: number, field: keyof TreasureStep, value: string) => {
    setContent((current) => {
      if (!current) {
        return current;
      }

      const nextSteps = [...current.treasureSteps];
      nextSteps[index] = {
        ...nextSteps[index],
        [field]: field === "lat" || field === "lng" ? toNumber(value) : value
      };

      return {
        ...current,
        treasureSteps: nextSteps
      };
    });
  };

  const updateStepValidationCodes = (index: number, rawValue: string) => {
    setContent((current) => {
      if (!current) {
        return current;
      }

      const nextSteps = [...current.treasureSteps];
      nextSteps[index] = {
        ...nextSteps[index],
        validationCodes: parseValidationCodes(rawValue)
      };

      return {
        ...current,
        treasureSteps: nextSteps
      };
    });
  };

  const updateStepExtra = (index: number, field: keyof StepDraftExtras, value: string) => {
    setStepExtras((current) => {
      const next = [...current];
      next[index] = {
        ...(next[index] ?? { mapsUrl: "" }),
        [field]: value
      };
      return next;
    });
  };

  const applyMapsUrlToStep = (index: number) => {
    const mapsUrl = stepExtras[index]?.mapsUrl ?? "";
    const coordinates = extractCoordinatesFromMapsUrl(mapsUrl);

    if (!coordinates) {
      setError("Impossible d'extraire les coordonnées depuis ce lien Maps.");
      setMessage("");
      return;
    }

    setError("");
    setMessage("Coordonnées récupérées depuis le lien Maps.");
    updateStep(index, "lat", String(coordinates.lat));
    updateStep(index, "lng", String(coordinates.lng));
  };

  const saveContent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/hunt-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          adminPassword,
          huntConfig,
          treasureSteps
        })
      });

      const data = (await response.json()) as ContentResponse;

      if (!response.ok) {
        setError(data.error ?? huntConfig.admin.errorMessage);
        return;
      }

      setContent({
        huntConfig: data.huntConfig,
        treasureSteps: data.treasureSteps
      });
      setMessage(data.message ?? "Contenu mis a jour.");
    } catch {
      setError("Impossible d'enregistrer pour le moment.");
    } finally {
      setIsSaving(false);
    }
  };

  const resetProgress = async () => {
    setIsResetting(true);
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
          adminPassword
        })
      });

      const data = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        setError(data.error ?? huntConfig.admin.errorMessage);
        return;
      }

      setMessage(data.message ?? huntConfig.admin.successMessage);
    } catch {
      setError("Impossible de réinitialiser pour le moment.");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fcfbf7] px-4 py-6 sm:px-6">
      <div className="street-grid absolute inset-0 opacity-40" />
      <div className="relative mx-auto max-w-[1100px]">
        <section className="rounded-[32px] border border-black/10 bg-white/88 p-6 shadow-soft backdrop-blur md:p-10">
          <p className="text-center text-[11px] uppercase tracking-[0.34em] text-[#b91c1c]">Interne</p>
          <h1 className="mt-4 text-center text-4xl font-semibold tracking-[-0.05em] text-ink md:text-5xl">
            {huntConfig.admin.title}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-center text-sm leading-7 text-black/68 md:text-base">
            {huntConfig.admin.description}
          </p>

          <form onSubmit={saveContent} className="mt-8 space-y-8">
            <div className="rounded-[24px] border border-black/10 bg-[#f5f3ec] p-5">
              <label className="block text-[11px] uppercase tracking-[0.28em] text-black/45">
                {huntConfig.admin.passwordLabel}
              </label>
              <input
                type="password"
                value={adminPassword}
                onChange={(event) => setAdminPassword(event.target.value)}
                placeholder={huntConfig.admin.passwordPlaceholder}
                className="mt-3 w-full rounded-[18px] border border-black/10 bg-white px-4 py-3 text-center text-base text-ink outline-none transition focus:border-[#b91c1c]"
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-[24px] border border-black/10 bg-white p-5">
                <p className="text-[11px] uppercase tracking-[0.28em] text-black/45">Textes</p>
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="mb-2 block text-[11px] uppercase tracking-[0.24em] text-black/45">Titre principal</label>
                    <input
                      value={huntConfig.title}
                      onChange={(event) => updateConfig("title", event.target.value)}
                      className="w-full rounded-[18px] border border-black/10 bg-[#f5f3ec] px-4 py-3"
                      placeholder="Titre"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-[11px] uppercase tracking-[0.24em] text-black/45">Sous-titre</label>
                    <textarea
                      value={huntConfig.subtitle}
                      onChange={(event) => updateConfig("subtitle", event.target.value)}
                      className="min-h-24 w-full rounded-[18px] border border-black/10 bg-[#f5f3ec] px-4 py-3"
                      placeholder="Sous-titre"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-[11px] uppercase tracking-[0.24em] text-black/45">Texte d&apos;introduction</label>
                    <textarea
                      value={huntConfig.intro}
                      onChange={(event) => updateConfig("intro", event.target.value)}
                      className="min-h-24 w-full rounded-[18px] border border-black/10 bg-[#f5f3ec] px-4 py-3"
                      placeholder="Introduction"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-[11px] uppercase tracking-[0.24em] text-black/45">Pop-up de succès</label>
                    <textarea
                      value={huntConfig.successMessage}
                      onChange={(event) => updateConfig("successMessage", event.target.value)}
                      className="min-h-24 w-full rounded-[18px] border border-black/10 bg-[#f5f3ec] px-4 py-3"
                      placeholder="Message de succès"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-[11px] uppercase tracking-[0.24em] text-black/45">Message final affiché quand tout est trouvé</label>
                    <textarea
                      value={huntConfig.finalMessage}
                      onChange={(event) => updateConfig("finalMessage", event.target.value)}
                      className="min-h-24 w-full rounded-[18px] border border-black/10 bg-[#f5f3ec] px-4 py-3"
                      placeholder="Message final"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-[11px] uppercase tracking-[0.24em] text-black/45">Texte secondaire final</label>
                    <input
                      value={huntConfig.finalCode}
                      onChange={(event) => updateConfig("finalCode", event.target.value)}
                      className="w-full rounded-[18px] border border-black/10 bg-[#f5f3ec] px-4 py-3"
                      placeholder="Texte secondaire final"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-black/10 bg-white p-5">
                <p className="text-[11px] uppercase tracking-[0.28em] text-black/45">Site lock</p>
                <div className="mt-4 space-y-4">
                  <label className="flex items-center gap-3 rounded-[18px] border border-black/10 bg-[#f5f3ec] px-4 py-3">
                    <input
                      type="checkbox"
                      checked={huntConfig.siteLock.enabled}
                      onChange={(event) =>
                        updateConfig("siteLock", {
                          ...huntConfig.siteLock,
                          enabled: event.target.checked
                        })
                      }
                    />
                    <span>Activer le lock</span>
                  </label>
                  <input
                    value={huntConfig.siteLock.releaseAtIso}
                    onChange={(event) =>
                      updateConfig("siteLock", {
                        ...huntConfig.siteLock,
                        releaseAtIso: event.target.value
                      })
                    }
                    className="w-full rounded-[18px] border border-black/10 bg-[#f5f3ec] px-4 py-3"
                    placeholder="Date ISO"
                  />
                  <input
                    value={huntConfig.siteLock.password}
                    onChange={(event) =>
                      updateConfig("siteLock", {
                        ...huntConfig.siteLock,
                        password: event.target.value
                      })
                    }
                    className="w-full rounded-[18px] border border-black/10 bg-[#f5f3ec] px-4 py-3"
                    placeholder="Mot de passe lock"
                  />
                  <input
                    value={huntConfig.siteLock.title}
                    onChange={(event) =>
                      updateConfig("siteLock", {
                        ...huntConfig.siteLock,
                        title: event.target.value
                      })
                    }
                    className="w-full rounded-[18px] border border-black/10 bg-[#f5f3ec] px-4 py-3"
                    placeholder="Titre de la page lock"
                  />
                  <input
                    value={huntConfig.siteLock.heading}
                    onChange={(event) =>
                      updateConfig("siteLock", {
                        ...huntConfig.siteLock,
                        heading: event.target.value
                      })
                    }
                    className="w-full rounded-[18px] border border-black/10 bg-[#f5f3ec] px-4 py-3"
                    placeholder="Petit titre de la page lock"
                  />
                  <textarea
                    value={huntConfig.siteLock.message}
                    onChange={(event) =>
                      updateConfig("siteLock", {
                        ...huntConfig.siteLock,
                        message: event.target.value
                      })
                    }
                    className="min-h-24 w-full rounded-[18px] border border-black/10 bg-[#f5f3ec] px-4 py-3"
                    placeholder="Texte affiché sur la page lock"
                  />
                  <input
                    value={huntConfig.logo.src}
                    onChange={(event) =>
                      updateConfig("logo", {
                        ...huntConfig.logo,
                        src: event.target.value
                      })
                    }
                    className="w-full rounded-[18px] border border-black/10 bg-[#f5f3ec] px-4 py-3"
                    placeholder="Chemin logo"
                  />
                  <input
                    value={huntConfig.center.lat}
                    onChange={(event) =>
                      updateConfig("center", {
                        ...huntConfig.center,
                        lat: toNumber(event.target.value)
                      })
                    }
                    className="w-full rounded-[18px] border border-black/10 bg-[#f5f3ec] px-4 py-3"
                    placeholder="Latitude centre"
                  />
                  <input
                    value={huntConfig.center.lng}
                    onChange={(event) =>
                      updateConfig("center", {
                        ...huntConfig.center,
                        lng: toNumber(event.target.value)
                      })
                    }
                    className="w-full rounded-[18px] border border-black/10 bg-[#f5f3ec] px-4 py-3"
                    placeholder="Longitude centre"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-black/10 bg-white p-5">
              <p className="text-[11px] uppercase tracking-[0.28em] text-black/45">Aperçu carte</p>
              <p className="mt-2 text-sm leading-6 text-black/60">
                La carte se met à jour immédiatement quand vous changez une position.
              </p>
              <div className="mt-4">
                <DynamicMap
                  center={huntConfig.center}
                  activeStepId={treasureSteps[0]?.id ?? null}
                  steps={treasureSteps}
                  statuses={previewStatuses}
                  onSelectStep={() => {}}
                />
              </div>
            </div>

            <div className="rounded-[24px] border border-black/10 bg-white p-5">
              <p className="text-[11px] uppercase tracking-[0.28em] text-black/45">Boîtes</p>
              <div className="mt-5 space-y-5">
                {treasureSteps.map((step, index) => (
                  <div key={step.id} className="rounded-[22px] border border-black/10 bg-[#f5f3ec] p-4">
                    <p className="text-[11px] uppercase tracking-[0.28em] text-black/45">Boîte {index + 1}</p>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <input
                        value={step.name}
                        onChange={(event) => updateStep(index, "name", event.target.value)}
                        className="rounded-[16px] border border-black/10 bg-white px-4 py-3"
                        placeholder="Nom"
                      />
                      <textarea
                        value={formatValidationCodes(step.validationCodes)}
                        onChange={(event) => updateStepValidationCodes(index, event.target.value)}
                        className="min-h-24 rounded-[16px] border border-black/10 bg-white px-4 py-3"
                        placeholder={"Codes valides, un par ligne\n2002\n4821"}
                      />
                      <input
                        value={step.address}
                        onChange={(event) => updateStep(index, "address", event.target.value)}
                        className="rounded-[16px] border border-black/10 bg-white px-4 py-3 md:col-span-2"
                        placeholder="Adresse"
                      />
                      <div className="md:col-span-2">
                        <div className="flex flex-col gap-2 md:flex-row">
                          <input
                            value={stepExtras[index]?.mapsUrl ?? ""}
                            onChange={(event) => updateStepExtra(index, "mapsUrl", event.target.value)}
                            className="flex-1 rounded-[16px] border border-black/10 bg-white px-4 py-3"
                            placeholder="Lien Google Maps / Apple Plans"
                          />
                          <button
                            type="button"
                            onClick={() => applyMapsUrlToStep(index)}
                            className="rounded-full border border-black/10 px-4 py-3 text-sm font-medium text-ink transition duration-300 hover:border-black/30 hover:bg-white"
                          >
                            Extraire la position
                          </button>
                        </div>
                      </div>
                      <input
                        value={step.lat}
                        onChange={(event) => updateStep(index, "lat", event.target.value)}
                        className="rounded-[16px] border border-black/10 bg-white px-4 py-3"
                        placeholder="Latitude"
                      />
                      <input
                        value={step.lng}
                        onChange={(event) => updateStep(index, "lng", event.target.value)}
                        className="rounded-[16px] border border-black/10 bg-white px-4 py-3"
                        placeholder="Longitude"
                      />
                      <textarea
                        value={step.hint}
                        onChange={(event) => updateStep(index, "hint", event.target.value)}
                        className="min-h-24 rounded-[16px] border border-black/10 bg-white px-4 py-3 md:col-span-2"
                        placeholder="Indice"
                      />
                      <textarea
                        value={step.description}
                        onChange={(event) => updateStep(index, "description", event.target.value)}
                        className="min-h-24 rounded-[16px] border border-black/10 bg-white px-4 py-3 md:col-span-2"
                        placeholder="Description"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {error ? <p className="text-center text-sm text-[#9a3412]">{error}</p> : null}
            {message ? <p className="text-center text-sm text-[#166534]">{message}</p> : null}

            <div className="flex flex-col gap-3 md:flex-row">
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 rounded-full bg-ink px-5 py-4 text-sm font-medium text-white transition duration-300 hover:bg-[#b91c1c] disabled:cursor-not-allowed disabled:bg-black/25"
              >
                {isSaving ? "Enregistrement..." : huntConfig.admin.saveLabel}
              </button>
              <button
                type="button"
                onClick={() => void resetProgress()}
                disabled={isResetting}
                className="flex-1 rounded-full border border-black/10 bg-white px-5 py-4 text-sm font-medium text-ink transition duration-300 hover:border-black/30 hover:bg-[#f5f3ec] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isResetting ? "Reset..." : huntConfig.admin.resetLabel}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
