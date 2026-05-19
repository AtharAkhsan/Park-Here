"use client";

import { RATE_PER_HOUR, ParkingSubState } from "../types";
import { Navigation, Timer, Banknote, MapPin } from "lucide-react";

interface ActiveParkingViewProps {
  slotLabel: string;
  subState: ParkingSubState;
  elapsedSeconds: number;
  locationName?: string;
  onArrived: () => void;
  onFinish: () => void;
}

function formatTime(totalSeconds: number): string {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function calculateCost(seconds: number): number {
  const hours = seconds / 3600;
  return Math.ceil(hours * RATE_PER_HOUR);
}

export default function ActiveParkingView({
  slotLabel,
  subState,
  elapsedSeconds,
  locationName = "FILKOM UB",
  onArrived,
  onFinish,
}: ActiveParkingViewProps) {
  if (subState === "navigating") {
    return (
      <div className="view-enter flex flex-col h-full">
        {/* Header */}
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[11px] font-semibold tracking-widest uppercase text-blue-500">
              Navigasi
            </span>
          </div>
          <h1 className="text-[22px] font-black tracking-tight text-gray-900">
            Menuju {slotLabel}
          </h1>
          <p className="text-gray-400 text-sm font-medium mt-0.5">
            Silakan menuju ke lokasi parkir
          </p>
        </div>

        {/* Navigation visual */}
        <div className="flex-1 flex flex-col items-center justify-center px-5">
          <div className="relative mb-8">
            <div className="w-32 h-32 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center animate-pulse-ring">
              <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center">
                <Navigation size={36} className="text-gray-900" />
              </div>
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 glass-card px-3 py-1 rounded-full">
              <span className="text-xs font-bold text-gray-900">{slotLabel}</span>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 w-full max-w-[280px] text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <MapPin size={14} className="text-gray-400" />
              <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">
                Tujuan Anda
              </span>
            </div>
            <p className="text-xl font-black text-gray-900">Slot {slotLabel}</p>
            <p className="text-sm text-gray-400 mt-1">
              {locationName} — Lantai 1
            </p>
          </div>
        </div>

        {/* Action */}
        <div className="px-5 pb-6 pt-4">
          <button
            id="btn-arrived"
            onClick={onArrived}
            className="btn-primary w-full py-4 rounded-2xl text-[15px] font-bold tracking-tight"
          >
            Saya Sudah Sampai
          </button>
        </div>
      </div>
    );
  }

  // Active parking state
  return (
    <div className="view-enter flex flex-col h-full">
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[11px] font-semibold tracking-widest uppercase text-green-600">
            Parkir Aktif
          </span>
        </div>
        <h1 className="text-[22px] font-black tracking-tight text-gray-900">
          Slot {slotLabel}
        </h1>
        <p className="text-gray-400 text-sm font-medium mt-0.5">
          Durasi parkir sedang berjalan
        </p>
      </div>

      {/* Timer */}
      <div className="flex-1 flex flex-col items-center justify-center px-5">
        <div className="mb-6">
          <div className="glass-card rounded-3xl p-8 text-center animate-glow">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Timer size={16} className="text-gray-400" />
              <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">
                Durasi Parkir
              </span>
            </div>
            <p className="text-5xl font-black tracking-tight tabular-nums animate-timer-pulse text-gray-900">
              {formatTime(elapsedSeconds)}
            </p>
          </div>
        </div>

        {/* Cost estimation */}
        <div className="glass-card-light rounded-2xl p-5 w-full">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Banknote size={16} className="text-gray-400" />
              <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">
                Estimasi Biaya
              </span>
            </div>
          </div>
          <p className="text-3xl font-black tracking-tight text-gray-900">
            Rp {calculateCost(elapsedSeconds).toLocaleString("id-ID")}
          </p>
          <p className="text-[11px] text-gray-400 mt-1.5 font-medium">
            Tarif: Rp {RATE_PER_HOUR.toLocaleString("id-ID")}/jam
          </p>
        </div>
      </div>

      {/* Action */}
      <div className="px-5 pb-6 pt-4">
        <button
          id="btn-finish"
          onClick={onFinish}
          className="btn-primary w-full py-4 rounded-2xl text-[15px] font-bold tracking-tight"
        >
          Selesai Parkir
        </button>
      </div>
    </div>
  );
}
