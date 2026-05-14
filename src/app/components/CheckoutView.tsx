"use client";

import { useState } from "react";
import { RATE_PER_HOUR } from "../types";
import { Clock, Banknote, CreditCard, ChevronRight, Wallet } from "lucide-react";

interface CheckoutViewProps {
  slotLabel: string;
  startTime: Date;
  endTime: Date;
  totalSeconds: number;
  onPay: (method: string) => void;
}

function formatClock(date: Date): string {
  return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function formatDuration(totalSeconds: number): string {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  if (hrs > 0) return `${hrs}j ${mins}m ${secs}d`;
  if (mins > 0) return `${mins}m ${secs}d`;
  return `${secs}d`;
}

function calculateTotal(seconds: number): number {
  return Math.ceil((seconds / 3600) * RATE_PER_HOUR);
}

const PAYMENT_METHODS = [
  { id: "gopay", name: "GoPay", icon: Wallet },
  { id: "ovo", name: "OVO", icon: Wallet },
  { id: "dana", name: "DANA", icon: Wallet },
  { id: "cc", name: "Kartu Kredit", icon: CreditCard },
];

export default function CheckoutView({ slotLabel, startTime, endTime, totalSeconds, onPay }: CheckoutViewProps) {
  const [selectedMethod, setSelectedMethod] = useState<string>("gopay");
  const total = calculateTotal(totalSeconds);

  return (
    <div className="view-enter flex flex-col h-full">
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-[22px] font-black tracking-tight text-gray-900">Rincian Biaya</h1>
        <p className="text-gray-400 text-sm font-medium mt-0.5">Slot {slotLabel} — Lantai 1</p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-4">
        <div className="glass-card rounded-2xl p-6 mb-4 text-center animate-glow">
          <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mb-2">Total Pembayaran</p>
          <p className="text-4xl font-black tracking-tight text-gray-900">Rp {total.toLocaleString("id-ID")}</p>
        </div>

        <div className="glass-card-light rounded-2xl p-4 mb-4 stagger-children">
          {[
            { icon: Clock, label: "Masuk", value: formatClock(startTime) },
            { icon: Clock, label: "Keluar", value: formatClock(endTime) },
            { icon: Clock, label: "Durasi", value: formatDuration(totalSeconds) },
            { icon: Banknote, label: "Tarif", value: `Rp ${RATE_PER_HOUR.toLocaleString("id-ID")}/jam` },
          ].map((item, i) => (
            <div key={i} className={`flex items-center justify-between py-2.5 ${i < 3 ? "border-b border-gray-100" : ""}`}>
              <div className="flex items-center gap-2.5">
                <item.icon size={14} className="text-gray-400" />
                <span className="text-sm text-gray-400">{item.label}</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{item.value}</span>
            </div>
          ))}
        </div>

        <div className="mb-2">
          <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mb-3 px-1">Metode Pembayaran</p>
          <div className="space-y-2 stagger-children">
            {PAYMENT_METHODS.map((method) => {
              const Icon = method.icon;
              const selected = selectedMethod === method.id;
              return (
                <button key={method.id} onClick={() => setSelectedMethod(method.id)}
                  className={`w-full glass-card-light rounded-xl p-3.5 flex items-center gap-3 transition-all ${selected ? "border border-gray-900 bg-gray-50 shadow-sm" : "border border-transparent hover:bg-gray-50"}`}>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${selected ? "border-gray-900" : "border-gray-300"}`}>
                    {selected && <div className="w-2.5 h-2.5 rounded-full bg-gray-900" />}
                  </div>
                  <Icon size={18} className="text-gray-400" />
                  <span className="text-sm font-semibold flex-1 text-left text-gray-900">{method.name}</span>
                  <ChevronRight size={14} className="text-gray-300" />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="px-5 pb-6 pt-3">
        <button id="btn-pay" onClick={() => onPay(selectedMethod)} className="btn-primary w-full py-4 rounded-2xl text-[15px] font-bold tracking-tight">
          Bayar Sekarang — Rp {total.toLocaleString("id-ID")}
        </button>
      </div>
    </div>
  );
}
