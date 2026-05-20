"use client";

import { useState, useEffect } from "react";
import { RATE_PER_HOUR } from "../types";
import { Clock, Banknote, ChevronRight, Wallet, QrCode, Smartphone } from "lucide-react";

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
  { id: "gopay", name: "GoPay", icon: Wallet, color: "#00AED6", bgColor: "#E6F9FC" },
  { id: "ovo", name: "OVO", icon: Wallet, color: "#4C3494", bgColor: "#F0ECF9" },
  { id: "dana", name: "DANA", icon: Wallet, color: "#108EE9", bgColor: "#E8F4FD" },
  { id: "qris", name: "QRIS", icon: QrCode, color: "#E4002B", bgColor: "#FDE8EC" },
];

// SVG-based QR code mockup generator
function QRCodeMockup({ brandColor, brandName, total }: { brandColor: string; brandName: string; total: number }) {
  // Generate a deterministic pattern based on brandName
  const seed = brandName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const modules: boolean[][] = [];
  for (let r = 0; r < 21; r++) {
    modules[r] = [];
    for (let c = 0; c < 21; c++) {
      // Position detection patterns (top-left, top-right, bottom-left)
      const inTopLeft = r < 7 && c < 7;
      const inTopRight = r < 7 && c > 13;
      const inBottomLeft = r > 13 && c < 7;

      if (inTopLeft || inTopRight || inBottomLeft) {
        // Draw finder pattern borders and centers
        const isEdge = (
          r === 0 || r === 6 || c === 0 || c === 6 ||
          (inTopRight && (c === 14 || c === 20)) ||
          (inBottomLeft && (r === 14 || r === 20))
        );
        const isInner = (
          (inTopLeft && r >= 2 && r <= 4 && c >= 2 && c <= 4) ||
          (inTopRight && r >= 2 && r <= 4 && c >= 16 && c <= 18) ||
          (inBottomLeft && r >= 16 && r <= 18 && c >= 2 && c <= 4)
        );
        modules[r][c] = isEdge || isInner;
      } else {
        // Pseudo-random data area
        modules[r][c] = ((r * 13 + c * 7 + seed) % 3) !== 0;
      }
    }
  }

  const cellSize = 8;
  const padding = 16;
  const size = 21 * cellSize + padding * 2;

  return (
    <div className="qr-container animate-scaleIn">
      {/* Brand header */}
      <div className="flex items-center justify-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: brandColor + '20' }}>
          <Smartphone size={14} style={{ color: brandColor }} />
        </div>
        <span className="text-sm font-bold" style={{ color: brandColor }}>{brandName}</span>
      </div>

      {/* QR Code SVG */}
      <div className="flex justify-center">
        <svg viewBox={`0 0 ${size} ${size}`} className="rounded-lg w-full max-w-[200px]">
          <rect width={size} height={size} fill="white" />
          {modules.map((row, r) =>
            row.map((filled, c) =>
              filled ? (
                <rect
                  key={`${r}-${c}`}
                  x={padding + c * cellSize}
                  y={padding + r * cellSize}
                  width={cellSize}
                  height={cellSize}
                  rx={1.5}
                  fill={r < 7 || c < 7 || (r < 7 && c > 13) || (r > 13 && c < 7) ? "#1a1a1a" : brandColor}
                />
              ) : null
            )
          )}
          {/* Center logo area */}
          <rect x={size/2 - 18} y={size/2 - 18} width={36} height={36} rx={8} fill="white" />
          <rect x={size/2 - 14} y={size/2 - 14} width={28} height={28} rx={6} fill={brandColor} />
          <text
            x={size/2}
            y={size/2 + 1}
            textAnchor="middle"
            dominantBaseline="central"
            fill="white"
            fontSize="8"
            fontWeight="900"
            fontFamily="Inter, sans-serif"
          >
            {brandName.charAt(0)}
          </text>
        </svg>
      </div>

      {/* Amount label */}
      <div className="text-center mt-3">
        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-0.5">Total Pembayaran</p>
        <p className="text-lg font-black text-gray-900">Rp {total.toLocaleString("id-ID")}</p>
      </div>

      {/* Scan instruction */}
      <div className="flex items-center justify-center gap-1.5 mt-2">
        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: brandColor }} />
        <p className="text-[11px] text-gray-400 font-medium">Scan QR code untuk membayar</p>
      </div>
    </div>
  );
}

export default function CheckoutView({ slotLabel, startTime, endTime, totalSeconds, onPay }: CheckoutViewProps) {
  const [selectedMethod, setSelectedMethod] = useState<string>("gopay");
  const [showQR, setShowQR] = useState(false);
  const [qrTimer, setQrTimer] = useState(300); // 5 minutes in seconds
  const total = calculateTotal(totalSeconds);
  const selectedPayment = PAYMENT_METHODS.find(m => m.id === selectedMethod)!;

  // QR countdown timer
  useEffect(() => {
    if (!showQR) {
      setQrTimer(300); // Reset timer when QR is hidden
      return;
    }
    if (qrTimer <= 0) return;

    const interval = setInterval(() => {
      setQrTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showQR, qrTimer]);

  const qrMinutes = Math.floor(qrTimer / 60);
  const qrSeconds = qrTimer % 60;
  const qrTimerText = `${qrMinutes}:${qrSeconds.toString().padStart(2, '0')}`;
  const isTimerLow = qrTimer <= 60;

  if (showQR) {
    return (
      <div className="view-enter flex flex-col h-full">
        <div className="px-5 pt-6 pb-4">
          <button
            onClick={() => setShowQR(false)}
            className="flex items-center gap-1.5 text-gray-400 hover:text-gray-900 transition-colors mb-3"
          >
            <ChevronRight size={18} className="rotate-180" />
            <span className="text-sm font-medium">Kembali</span>
          </button>
          <h1 className="text-[22px] font-black tracking-tight text-gray-900">Scan & Bayar</h1>
          <p className="text-gray-400 text-sm font-medium mt-0.5">
            Scan QR code dengan aplikasi {selectedPayment.name}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-4 flex flex-col items-center justify-center">
          {qrTimer > 0 ? (
            <QRCodeMockup
              brandColor={selectedPayment.color}
              brandName={selectedPayment.name}
              total={total}
            />
          ) : (
            <div className="qr-container animate-scaleIn text-center py-8">
              <p className="text-lg font-bold text-gray-900 mb-1">QR Code Kedaluwarsa</p>
              <p className="text-sm text-gray-400 mb-4">Silakan kembali dan coba lagi</p>
              <button
                onClick={() => { setShowQR(false); }}
                className="btn-primary px-6 py-2.5 rounded-xl text-sm font-bold"
              >
                Kembali
              </button>
            </div>
          )}

          <div className="mt-4 w-full max-w-[280px]">
            <div className="glass-card-light rounded-xl p-3 text-center">
              <p className="text-[11px] text-gray-400 font-medium">QR berlaku selama</p>
              <p className={`text-sm font-bold ${isTimerLow ? "text-red-500 animate-timer-pulse" : "text-gray-900"}`}>
                {qrTimerText} menit
              </p>
            </div>
          </div>
        </div>

        <div className="px-5 pb-6 pt-3">
          <button
            id="btn-confirm-pay"
            onClick={() => onPay(selectedMethod)}
            disabled={qrTimer <= 0}
            className="btn-primary w-full py-4 rounded-2xl text-[15px] font-bold tracking-tight disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Konfirmasi Pembayaran
          </button>
        </div>
      </div>
    );
  }

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
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: method.bgColor }}>
                    <Icon size={16} style={{ color: method.color }} />
                  </div>
                  <span className="text-sm font-semibold flex-1 text-left text-gray-900">{method.name}</span>
                  <ChevronRight size={14} className="text-gray-300" />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="px-5 pb-6 pt-3">
        <button id="btn-pay" onClick={() => setShowQR(true)} className="btn-primary w-full py-4 rounded-2xl text-[15px] font-bold tracking-tight flex items-center justify-center gap-2">
          <QrCode size={18} />
          Bayar Sekarang — Rp {total.toLocaleString("id-ID")}
        </button>
      </div>
    </div>
  );
}

