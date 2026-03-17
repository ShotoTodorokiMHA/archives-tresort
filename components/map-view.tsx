"use client";

import "leaflet/dist/leaflet.css";
import { divIcon } from "leaflet";
import { MapContainer, Marker, Popup, Polyline, TileLayer, ZoomControl } from "react-leaflet";
import { TreasureStep } from "@/data/hunt-config";
import { StepStatus, clsx } from "@/lib/utils";

type MapViewProps = {
  center: { lat: number; lng: number };
  activeStepId: string | null;
  steps: TreasureStep[];
  statuses: Record<string, StepStatus>;
  onSelectStep: (stepId: string) => void;
};

const markerIcon = (status: StepStatus) =>
  divIcon({
    className: "",
    html: `<div class="custom-marker ${status === "locked" ? "marker-locked" : status === "validated" ? "marker-completed" : "marker-unlocked"}"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11]
  });

export function MapView({
  center,
  activeStepId,
  steps,
  statuses,
  onSelectStep
}: MapViewProps) {
  const routePositions = steps.map((step) => [step.lat, step.lng] as [number, number]);

  return (
    <div className="relative h-[440px] overflow-hidden rounded-[28px] border border-black/10 bg-[#ebe8de] shadow-soft md:h-[620px]">
      <div className="pointer-events-none absolute inset-0 z-[400] bg-gradient-to-b from-white/24 via-transparent to-black/5" />
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={14}
        minZoom={12}
        scrollWheelZoom
        zoomControl={false}
        className="z-0"
      >
        <ZoomControl position="bottomright" />
        <TileLayer
          className="map-tile-tone"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polyline
          positions={routePositions}
          pathOptions={{
            color: "#b91c1c",
            weight: 4,
            opacity: 0.9,
            dashArray: "10 10"
          }}
        />
        {steps.map((step, index) => {
          const status = statuses[step.id];
          const isActive = activeStepId === step.id;

          return (
            <Marker
              key={step.id}
              position={[step.lat, step.lng]}
              icon={markerIcon(status)}
              eventHandlers={{
                click: () => onSelectStep(step.id)
              }}
            >
              <Popup>
                <div className="w-[250px] rounded-[20px] bg-[#faf9f5] p-4 text-ink">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="text-[11px] uppercase tracking-[0.28em] text-black/45">
                      Etape {index + 1}
                    </span>
                    <span
                      className={clsx(
                        "rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.2em]",
                        status === "validated" && "bg-black text-white",
                        status === "unlocked" && "bg-[#b91c1c] text-white",
                        status === "locked" && "bg-black/8 text-black/50"
                      )}
                    >
                      {status === "validated"
                        ? "Validee"
                        : status === "unlocked"
                          ? "Ouverte"
                          : "Verrouillee"}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold">{step.name}</h3>
                  <p className="mt-1 text-sm text-black/58">{step.address}</p>
                  <p className="mt-4 text-sm leading-6 text-black/80">
                    {status === "locked"
                      ? "Cette etape sera disponible apres validation de la precedente."
                      : step.hint}
                  </p>
                  {isActive ? (
                    <p className="mt-4 text-center text-xs uppercase tracking-[0.24em] text-[#b91c1c]">
                      Selection actuelle
                    </p>
                  ) : null}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
