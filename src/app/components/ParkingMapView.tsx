"use client";

import { ParkingSlot } from "../types";
import { Car, MapPin, ChevronLeft } from "lucide-react";

interface ParkingMapViewProps {
  slots: ParkingSlot[];
  onSlotClick: (slot: ParkingSlot) => void;
  emptyCount: number;
  filledCount: number;
  disabled?: boolean;
  selectedSlotId?: string;
  locationName?: string;
  locationSubtitle?: string;
  onBack?: () => void;
}

export default function ParkingMapView({
  slots,
  onSlotClick,
  emptyCount,
  filledCount,
  disabled = false,
  selectedSlotId,
  locationName = "FILKOM UB",
  locationSubtitle = "Lantai 1 — Area A",
  onBack,
}: ParkingMapViewProps) {
  const getSlotClass = (slot: ParkingSlot) => {
    if (selectedSlotId && slot.id === selectedSlotId) return "slot-reserved";
    switch (slot.status) {
      case "empty":
        return "slot-empty";
      case "filled":
        return "slot-filled";
      case "reserved":
      case "active":
        return "slot-reserved";
      default:
        return "slot-empty";
    }
  };

  // Group slots by row_letter
  const rowLetters = [...new Set(slots.map((s) => s.row_letter || s.label.charAt(0)))].sort();
  const rows = rowLetters.map((letter) =>
    slots.filter((s) => (s.row_letter || s.label.charAt(0)) === letter)
  );

  return (
    <div className="view-enter flex flex-col h-full">
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-gray-400 hover:text-gray-900 transition-colors mb-3"
          >
            <ChevronLeft size={18} />
            <span className="text-sm font-medium">Semua Lokasi</span>
          </button>
        )}
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[11px] font-semibold tracking-widest uppercase text-gray-400">
            Real-time
          </span>
        </div>
        <h1 className="text-[22px] font-black tracking-tight leading-tight text-gray-900">
          {locationName}
        </h1>
        <p className="text-gray-400 text-sm font-medium mt-0.5">
          {locationSubtitle}
        </p>
      </div>

      {/* Stats bar */}
      <div className="px-5 mb-5">
        <div className="glass-card rounded-xl p-3.5 grid grid-cols-3">
          <div className="flex items-center gap-2.5 justify-center border-r border-gray-200">
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
              <MapPin size={16} className="text-green-500" />
            </div>
            <div>
              <p className="text-[11px] text-gray-400 font-medium">Tersedia</p>
              <p className="text-lg font-bold leading-none text-gray-900">{emptyCount}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 justify-center border-r border-gray-200">
            <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center">
              <Car size={16} className="text-pink-400" />
            </div>
            <div>
              <p className="text-[11px] text-gray-400 font-medium">Terisi</p>
              <p className="text-lg font-bold leading-none text-gray-900">{filledCount}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 justify-center">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
              <Car size={16} className="text-gray-400" />
            </div>
            <div>
              <p className="text-[11px] text-gray-400 font-medium">Total</p>
              <p className="text-lg font-bold leading-none text-gray-900">{slots.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 px-5 overflow-y-auto pb-4">
        <div className="glass-card rounded-2xl p-4 animate-glow relative">
          {/* Disabled overlay */}
          {disabled && (
            <div className="absolute inset-0 z-10 rounded-2xl bg-black/5 backdrop-blur-[0.5px] cursor-not-allowed" />
          )}

          {/* Disabled badge (Centered) */}
          {disabled && (
            <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
              <div className="bg-white/90 border border-gray-200 rounded-xl px-5 py-2.5 shadow-lg backdrop-blur-sm">
                <span className="text-xs font-black text-gray-800 uppercase tracking-widest">Sesi Aktif</span>
              </div>
            </div>
          )}

          {/* Lane markings top */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold tracking-widest text-gray-300 uppercase">Masuk →</span>
            <span className="text-[10px] font-bold tracking-widest text-gray-300 uppercase">← Keluar</span>
          </div>

          {/* Grid rows */}
          <div className="space-y-3 stagger-children">
            {rows.map((row, rowIdx) => (
              <div key={rowIdx}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-[10px] font-bold text-gray-300">{rowLetters[rowIdx]}</span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {row.map((slot) => {
                    const isSelected = selectedSlotId && slot.id === selectedSlotId;
                    return (
                    <button
                      key={slot.id}
                      id={`slot-${slot.id}`}
                      disabled={slot.status !== "empty" || disabled}
                      onClick={() => onSlotClick(slot)}
                      className={`${getSlotClass(slot)} rounded-lg aspect-square flex flex-col items-center justify-center text-center relative group transition-all duration-300 ${
                        isSelected ? "z-20 shadow-lg ring-2 ring-blue-400 ring-offset-2 ring-offset-white" : ""
                      }`}
                    >
                      <span className={`text-[11px] font-bold ${
                        (selectedSlotId && slot.id === selectedSlotId) || slot.status === "reserved" || slot.status === "active" ? "text-blue-600"
                        : slot.status === "filled" ? "text-pink-700"
                        : "text-gray-500"
                      }`}>
                        {slot.label}
                      </span>
                      {slot.status === "filled" && <Car size={12} className="text-pink-400 mt-0.5" />}
                      {((selectedSlotId && slot.id === selectedSlotId) || slot.status === "reserved" || slot.status === "active") && (
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-0.5 animate-pulse" />
                      )}
                    </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-4 border-t border-dashed border-gray-200 pt-3">
            <div className="flex items-center justify-center gap-5">
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded border border-dashed border-gray-400 bg-gray-50" />
                <span className="text-[10px] text-gray-500 font-semibold">Kosong</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded bg-pink-100 border border-pink-300" />
                <span className="text-[10px] text-gray-500 font-semibold">Terisi</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded bg-blue-100 border border-blue-400" />
                <span className="text-[10px] text-gray-500 font-semibold">Reservasi</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
