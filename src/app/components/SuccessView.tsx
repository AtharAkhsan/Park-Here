"use client";

import { RATE_PER_HOUR } from "../types";
import { CheckCircle2, Receipt, Clock, MapPin, Banknote } from "lucide-react";

interface SuccessViewProps {
  slotLabel: string;
  startTime: Date;
  endTime: Date;
  totalSeconds: number;
  paymentMethod: string;
  onReset: () => void;
}

function formatClock(date: Date): string {
  return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function formatDuration(totalSeconds: number): string {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  if (hrs > 0) return `${hrs} jam ${mins} menit ${secs} detik`;
  if (mins > 0) return `${mins} menit ${secs} detik`;
  return `${secs} detik`;
}

function calculateTotal(seconds: number): number {
  return Math.ceil((seconds / 3600) * RATE_PER_HOUR);
}

const METHOD_NAMES: Record<string, string> = {
  gopay: "GoPay", ovo: "OVO", dana: "DANA", cc: "Kartu Kredit",
};

export default function SuccessView({ slotLabel, startTime, endTime, totalSeconds, paymentMethod, onReset }: SuccessViewProps) {
  const total = calculateTotal(totalSeconds);
  const txId = `PH-${Date.now().toString(36).toUpperCase()}`;

  return (
    <div className="view-enter flex flex-col h-full">
      {/* Success hero */}
      <div className="flex flex-col items-center pt-12 pb-6 px-5">
        <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center mb-5 animate-checkmark">
          <CheckCircle2 size={40} className="text-white" />
        </div>
        <h1 className="text-2xl font-black tracking-tight mb-1 text-gray-900">Pembayaran Berhasil!</h1>
        <p className="text-gray-400 text-sm font-medium">Terima kasih telah menggunakan PARK-HERE</p>
      </div>

      {/* Digital receipt */}
      <div className="flex-1 px-5 overflow-y-auto">
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <Receipt size={14} className="text-gray-400" />
              <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Struk Digital</span>
            </div>
            <p className="text-xs text-gray-300 font-mono">{txId}</p>
          </div>

          <div className="p-4 space-y-3 stagger-children">
            {[
              { icon: MapPin, label: "Slot", value: slotLabel },
              { icon: MapPin, label: "Lokasi", value: "FILKOM UB — Lt. 1" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <item.icon size={13} className="text-gray-400" />
                  <span className="text-sm text-gray-400">{item.label}</span>
                </div>
                <span className="text-sm font-bold text-gray-900">{item.value}</span>
              </div>
            ))}
            <div className="h-px bg-gray-100" />
            {[
              { icon: Clock, label: "Masuk", value: formatClock(startTime) },
              { icon: Clock, label: "Keluar", value: formatClock(endTime) },
              { icon: Clock, label: "Durasi", value: formatDuration(totalSeconds) },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <item.icon size={13} className="text-gray-400" />
                  <span className="text-sm text-gray-400">{item.label}</span>
                </div>
                <span className="text-sm font-bold text-gray-900">{item.value}</span>
              </div>
            ))}
            <div className="h-px bg-gray-100" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Banknote size={13} className="text-gray-400" />
                <span className="text-sm text-gray-400">Metode</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{METHOD_NAMES[paymentMethod] || paymentMethod}</span>
            </div>
          </div>

          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-400">Total</span>
              <span className="text-xl font-black text-gray-900">Rp {total.toLocaleString("id-ID")}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 pb-6 pt-4">
        <button id="btn-home" onClick={onReset} className="btn-primary w-full py-4 rounded-2xl text-[15px] font-bold tracking-tight">
          Kembali ke Beranda
        </button>
      </div>
    </div>
  );
}
