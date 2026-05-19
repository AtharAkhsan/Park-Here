"use client";

import { RATE_PER_HOUR } from "../types";
import { MapPin, Clock, Banknote, ChevronLeft, ShieldCheck } from "lucide-react";

interface SlotDetailViewProps {
  slotLabel: string;
  location: string;
  ratePerHour?: number;
  operatingHours?: string;
  onReserve: () => void;
  onBack: () => void;
}

export default function SlotDetailView({
  slotLabel,
  location,
  ratePerHour = RATE_PER_HOUR,
  operatingHours = "06:00 — 22:00 WIB",
  onReserve,
  onBack,
}: SlotDetailViewProps) {
  return (
    <div className="view-enter flex flex-col h-full">
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-gray-400 hover:text-gray-900 transition-colors mb-4"
        >
          <ChevronLeft size={18} />
          <span className="text-sm font-medium">Kembali</span>
        </button>
        <h1 className="text-[22px] font-black tracking-tight text-gray-900">
          Slot {slotLabel}
        </h1>
        <p className="text-gray-400 text-sm font-medium mt-0.5">
          Detail & Reservasi
        </p>
      </div>

      {/* Slot visual */}
      <div className="px-5 mb-5">
        <div className="glass-card rounded-2xl p-6 flex flex-col items-center animate-glow">
          <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center mb-4 bg-gray-50">
            <span className="text-3xl font-black tracking-tight text-gray-900">
              {slotLabel}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-sm font-semibold text-green-600">
              Spot Kosong
            </span>
          </div>
        </div>
      </div>

      {/* Info cards */}
      <div className="px-5 space-y-3 stagger-children">
        <div className="glass-card-light rounded-xl p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
            <MapPin size={18} className="text-gray-400" />
          </div>
          <div>
            <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">
              Lokasi
            </p>
            <p className="text-sm font-bold text-gray-900">{location}</p>
          </div>
        </div>

        <div className="glass-card-light rounded-xl p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
            <Banknote size={18} className="text-gray-400" />
          </div>
          <div>
            <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">
              Tarif
            </p>
            <p className="text-sm font-bold text-gray-900">
              Rp {ratePerHour.toLocaleString("id-ID")}/jam
            </p>
          </div>
        </div>

        <div className="glass-card-light rounded-xl p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
            <Clock size={18} className="text-gray-400" />
          </div>
          <div>
            <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">
              Jam Operasional
            </p>
            <p className="text-sm font-bold text-gray-900">{operatingHours}</p>
          </div>
        </div>

        <div className="glass-card-light rounded-xl p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={18} className="text-gray-400" />
          </div>
          <div>
            <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">
              Keamanan
            </p>
            <p className="text-sm font-bold text-gray-900">CCTV 24 Jam Aktif</p>
          </div>
        </div>
      </div>

      {/* Reserve button */}
      <div className="mt-auto px-5 pb-6 pt-4">
        <button
          id="btn-reserve"
          onClick={onReserve}
          className="btn-primary w-full py-4 rounded-2xl text-[15px] font-bold tracking-tight"
        >
          Reservasi Slot {slotLabel}
        </button>
      </div>
    </div>
  );
}
