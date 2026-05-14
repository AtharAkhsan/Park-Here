"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AppView,
  ParkingSubState,
  ParkingSlot,
  ParkingSession,
  INITIAL_SLOTS,
  SLOT_LOCATIONS,
  RATE_PER_HOUR,
} from "./types";
import ParkingMapView from "./components/ParkingMapView";
import SlotDetailView from "./components/SlotDetailView";
import ActiveParkingView from "./components/ActiveParkingView";
import CheckoutView from "./components/CheckoutView";
import SuccessView from "./components/SuccessView";
import Image from "next/image";

export default function Home() {
  // ─── State Machine ───────────────────────────────────
  const [currentView, setCurrentView] = useState<AppView>("map");
  const [parkingSubState, setParkingSubState] =
    useState<ParkingSubState>("navigating");
  const [slots, setSlots] = useState<ParkingSlot[]>(INITIAL_SLOTS);
  const [session, setSession] = useState<ParkingSession>({
    slotId: "",
    slotLabel: "",
    location: "",
    rate: RATE_PER_HOUR,
    startTime: null,
    endTime: null,
    elapsedSeconds: 0,
  });
  const [paymentMethod, setPaymentMethod] = useState<string>("gopay");

  // Timer
  useEffect(() => {
    if (currentView !== "parking" || parkingSubState !== "active") return;
    const interval = setInterval(() => {
      setSession((prev) => ({
        ...prev,
        elapsedSeconds: prev.elapsedSeconds + 1,
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, [currentView, parkingSubState]);

  // ─── Slot counts ────────────────────────────────────
  const emptyCount = slots.filter((s) => s.status === "empty").length;
  const filledCount = slots.filter(
    (s) => s.status === "filled" || s.status === "reserved" || s.status === "active"
  ).length;

  // ─── Is session active? (locks the map) ─────────────
  const isSessionActive = ["parking", "checkout", "success"].includes(currentView);

  // ─── Handlers ───────────────────────────────────────
  const handleSlotClick = useCallback((slot: ParkingSlot) => {
    if (slot.status !== "empty") return;
    if (isSessionActive) return; // Prevent selecting another slot
    setSession({
      slotId: slot.id,
      slotLabel: slot.label,
      location: SLOT_LOCATIONS[slot.label] || "Area Parkir",
      rate: RATE_PER_HOUR,
      startTime: null,
      endTime: null,
      elapsedSeconds: 0,
    });
    setCurrentView("detail");
  }, [isSessionActive]);

  const handleReserve = useCallback(() => {
    setSlots((prev) =>
      prev.map((s) =>
        s.id === session.slotId ? { ...s, status: "reserved" as const } : s
      )
    );
    setParkingSubState("navigating");
    setCurrentView("parking");
  }, [session.slotId]);

  const handleArrived = useCallback(() => {
    const now = new Date();
    setSession((prev) => ({ ...prev, startTime: now, elapsedSeconds: 0 }));
    setSlots((prev) =>
      prev.map((s) =>
        s.id === session.slotId ? { ...s, status: "active" as const } : s
      )
    );
    setParkingSubState("active");
  }, [session.slotId]);

  const handleFinishParking = useCallback(() => {
    const now = new Date();
    setSession((prev) => ({ ...prev, endTime: now }));
    setCurrentView("checkout");
  }, []);

  const handlePay = useCallback(
    (method: string) => {
      setPaymentMethod(method);
      setSlots((prev) =>
        prev.map((s) =>
          s.id === session.slotId ? { ...s, status: "empty" as const } : s
        )
      );
      setCurrentView("success");
    },
    [session.slotId]
  );

  const handleReset = useCallback(() => {
    setSession({
      slotId: "",
      slotLabel: "",
      location: "",
      rate: RATE_PER_HOUR,
      startTime: null,
      endTime: null,
      elapsedSeconds: 0,
    });
    setParkingSubState("navigating");
    setPaymentMethod("gopay");
    setCurrentView("map");
  }, []);

  const handleBackToMap = useCallback(() => {
    setCurrentView("map");
  }, []);

  // ─── Secondary panel content ──
  const renderSecondaryView = () => {
    switch (currentView) {
      case "detail":
        return (
          <SlotDetailView
            slotLabel={session.slotLabel}
            location={session.location}
            onReserve={handleReserve}
            onBack={handleBackToMap}
          />
        );
      case "parking":
        return (
          <ActiveParkingView
            slotLabel={session.slotLabel}
            subState={parkingSubState}
            elapsedSeconds={session.elapsedSeconds}
            onArrived={handleArrived}
            onFinish={handleFinishParking}
          />
        );
      case "checkout":
        return (
          <CheckoutView
            slotLabel={session.slotLabel}
            startTime={session.startTime!}
            endTime={session.endTime!}
            totalSeconds={session.elapsedSeconds}
            onPay={handlePay}
          />
        );
      case "success":
        return (
          <SuccessView
            slotLabel={session.slotLabel}
            startTime={session.startTime!}
            endTime={session.endTime!}
            totalSeconds={session.elapsedSeconds}
            paymentMethod={paymentMethod}
            onReset={handleReset}
          />
        );
      default:
        return null;
    }
  };

  const hasSecondaryView = currentView !== "map";

  // ─── Logo component ────────────────────────────────
  const Logo = ({ size = 28 }: { size?: number }) => (
    <Image src="/logo.svg" alt="PARK-HERE" width={size} height={size} className="flex-shrink-0" />
  );

  // ─── Render ────────────────────────────────────────
  return (
    <>
      {/* ═══ MOBILE LAYOUT (< md) ═══ */}
      <main className="md:hidden w-full max-w-[430px] mx-auto min-h-screen bg-white relative overflow-hidden flex flex-col">
        {/* App chrome / top bar */}
        <div className="flex-shrink-0 px-5 pt-3 pb-2 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Logo size={24} />
            <span className="text-[13px] font-black tracking-tight text-gray-900">
              PARK-HERE
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-[10px] font-medium text-gray-400">Online</span>
          </div>
        </div>

        {/* View container — full screen on mobile */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {currentView === "map" ? (
            <ParkingMapView
              slots={slots}
              onSlotClick={handleSlotClick}
              emptyCount={emptyCount}
              filledCount={filledCount}
              disabled={false}
              selectedSlotId={undefined}
            />
          ) : (
            renderSecondaryView()
          )}
        </div>

        <div className="flex-shrink-0 h-2 bg-white" />
      </main>

      {/* ═══ DESKTOP LAYOUT (≥ md) ═══ */}
      <main className="hidden md:flex w-full min-h-screen bg-white">
        {/* Left panel — Parking Map (always visible) */}
        <div className="w-[50%] max-w-[560px] flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
          {/* Top bar */}
          <div className="flex-shrink-0 px-6 pt-4 pb-3 flex items-center justify-between border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <Logo size={28} />
              <span className="text-[14px] font-black tracking-tight text-gray-900">
                PARK-HERE
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-[11px] font-medium text-gray-400">Online</span>
            </div>
          </div>

          {/* Map always rendered */}
          <div className="flex-1 overflow-y-auto">
            <ParkingMapView
              slots={slots}
              onSlotClick={handleSlotClick}
              emptyCount={emptyCount}
              filledCount={filledCount}
              disabled={isSessionActive}
              selectedSlotId={currentView !== "map" ? session.slotId : undefined}
            />
          </div>
        </div>

        {/* Right panel — Detail / Action (fills remaining space) */}
        <div className="flex-1 flex flex-col min-w-0 bg-gray-50/50">
          {hasSecondaryView ? (
            <div className="flex-1 flex flex-col bg-white">
              {renderSecondaryView()}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8 animate-fadeIn">
              <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-6">
                <Logo size={40} />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                Pilih Slot Parkir
              </h2>
              <p className="text-sm text-gray-400 max-w-[280px] leading-relaxed">
                Klik salah satu slot yang tersedia di panel kiri untuk melihat detail dan melakukan reservasi.
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
