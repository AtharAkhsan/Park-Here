"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AppView,
  ParkingSubState,
  ParkingSlot,
  ParkingSession,
  ParkingLocation,
  RATE_PER_HOUR,
} from "./types";
import { supabase } from "./lib/supabase";
import LocationListView from "./components/LocationListView";
import ParkingMapView from "./components/ParkingMapView";
import SlotDetailView from "./components/SlotDetailView";
import ActiveParkingView from "./components/ActiveParkingView";
import CheckoutView from "./components/CheckoutView";
import SuccessView from "./components/SuccessView";
import Image from "next/image";

export default function Home() {
  // ─── State Machine ───────────────────────────────────
  const [currentView, setCurrentView] = useState<AppView>("locations");
  const [parkingSubState, setParkingSubState] =
    useState<ParkingSubState>("navigating");
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
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

  // ─── Location State ─────────────────────────────────
  const [locations, setLocations] = useState<ParkingLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<ParkingLocation | null>(null);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // ─── Fetch Locations from Supabase ──────────────────
  useEffect(() => {
    async function fetchLocations() {
      setLocationsLoading(true);
      const { data: locs, error: locError } = await supabase
        .from("parking_locations")
        .select("*")
        .order("name");

      if (locError) {
        console.error("Error fetching locations:", locError);
        setLocationsLoading(false);
        return;
      }

      // Fetch available slot counts for each location
      const { data: slotCounts, error: slotError } = await supabase
        .from("parking_slots")
        .select("location_id, status");

      if (slotError) {
        console.error("Error fetching slot counts:", slotError);
      }

      const locationsWithCounts: ParkingLocation[] = (locs || []).map((loc) => {
        const locationSlots = (slotCounts || []).filter(
          (s) => s.location_id === loc.id
        );
        const available = locationSlots.filter((s) => s.status === "empty").length;
        return {
          ...loc,
          available_slots: available,
        };
      });

      setLocations(locationsWithCounts);
      setLocationsLoading(false);
    }

    fetchLocations();
  }, []);

  // ─── Fetch Slots for Selected Location ──────────────
  const fetchSlotsForLocation = useCallback(async (locationId: string) => {
    setSlotsLoading(true);
    const { data, error } = await supabase
      .from("parking_slots")
      .select("*")
      .eq("location_id", locationId)
      .order("label");

    if (error) {
      console.error("Error fetching slots:", error);
      setSlotsLoading(false);
      return;
    }

    const mappedSlots: ParkingSlot[] = (data || []).map((s) => ({
      id: s.id,
      label: s.label,
      status: s.status as ParkingSlot["status"],
      sublocation: s.sublocation,
      row_letter: s.row_letter,
      location_id: s.location_id,
    }));

    setSlots(mappedSlots);
    setSlotsLoading(false);
  }, []);

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
  const handleSelectLocation = useCallback(
    async (location: ParkingLocation) => {
      setSelectedLocation(location);
      await fetchSlotsForLocation(location.id);
      setCurrentView("map");
    },
    [fetchSlotsForLocation]
  );

  const handleBackToLocations = useCallback(() => {
    setSelectedLocation(null);
    setSlots([]);
    setCurrentView("locations");
  }, []);

  const handleSlotClick = useCallback(
    (slot: ParkingSlot) => {
      if (slot.status !== "empty") return;
      if (isSessionActive) return;
      setSession({
        slotId: slot.id,
        slotLabel: slot.label,
        location: slot.sublocation || "Area Parkir",
        rate: selectedLocation?.rate_per_hour || RATE_PER_HOUR,
        startTime: null,
        endTime: null,
        elapsedSeconds: 0,
      });
      setCurrentView("detail");
    },
    [isSessionActive, selectedLocation]
  );

  const handleReserve = useCallback(async () => {
    // Update slot status in Supabase
    await supabase
      .from("parking_slots")
      .update({ status: "reserved" })
      .eq("id", session.slotId);

    setSlots((prev) =>
      prev.map((s) =>
        s.id === session.slotId ? { ...s, status: "reserved" as const } : s
      )
    );
    setParkingSubState("navigating");
    setCurrentView("parking");
  }, [session.slotId]);

  const handleArrived = useCallback(async () => {
    const now = new Date();
    setSession((prev) => ({ ...prev, startTime: now, elapsedSeconds: 0 }));

    // Update slot status in Supabase
    await supabase
      .from("parking_slots")
      .update({ status: "active" })
      .eq("id", session.slotId);

    // Create parking session in Supabase
    await supabase.from("parking_sessions").insert({
      slot_id: session.slotId,
      location_id: selectedLocation?.id,
      start_time: now.toISOString(),
      status: "active",
    });

    setSlots((prev) =>
      prev.map((s) =>
        s.id === session.slotId ? { ...s, status: "active" as const } : s
      )
    );
    setParkingSubState("active");
  }, [session.slotId, selectedLocation]);

  const handleFinishParking = useCallback(() => {
    const now = new Date();
    setSession((prev) => ({ ...prev, endTime: now }));
    setCurrentView("checkout");
  }, []);

  const handlePay = useCallback(
    async (method: string) => {
      setPaymentMethod(method);

      const totalCost = Math.ceil(
        (session.elapsedSeconds / 3600) * (selectedLocation?.rate_per_hour || RATE_PER_HOUR)
      );

      // Update slot status back to empty in Supabase
      await supabase
        .from("parking_slots")
        .update({ status: "empty" })
        .eq("id", session.slotId);

      // Update session in Supabase
      await supabase
        .from("parking_sessions")
        .update({
          end_time: new Date().toISOString(),
          total_cost: totalCost,
          payment_method: method,
          status: "completed",
        })
        .eq("slot_id", session.slotId)
        .eq("status", "active");

      setSlots((prev) =>
        prev.map((s) =>
          s.id === session.slotId ? { ...s, status: "empty" as const } : s
        )
      );
      setCurrentView("success");
    },
    [session.slotId, session.elapsedSeconds, selectedLocation]
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
    setSelectedLocation(null);
    setSlots([]);
    setCurrentView("locations");
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
            ratePerHour={selectedLocation?.rate_per_hour}
            operatingHours={selectedLocation?.operating_hours}
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
            locationName={selectedLocation?.name}
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
            locationName={selectedLocation?.name}
            onReset={handleReset}
          />
        );
      default:
        return null;
    }
  };

  const hasSecondaryView = !["map", "locations"].includes(currentView);

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
          {currentView === "locations" ? (
            <LocationListView
              locations={locations}
              onSelectLocation={handleSelectLocation}
              loading={locationsLoading}
            />
          ) : currentView === "map" ? (
            <ParkingMapView
              slots={slots}
              onSlotClick={handleSlotClick}
              emptyCount={emptyCount}
              filledCount={filledCount}
              disabled={false}
              selectedSlotId={undefined}
              locationName={selectedLocation?.name}
              locationSubtitle={`${selectedLocation?.full_name || ""}`}
              onBack={handleBackToLocations}
            />
          ) : (
            renderSecondaryView()
          )}
        </div>

        <div className="flex-shrink-0 h-2 bg-white" />
      </main>

      {/* ═══ DESKTOP LAYOUT (≥ md) ═══ */}
      <main className="hidden md:flex w-full min-h-screen bg-white">
        {/* Left panel */}
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

          {/* Left content */}
          <div className="flex-1 overflow-y-auto">
            {currentView === "locations" ? (
              <LocationListView
                locations={locations}
                onSelectLocation={handleSelectLocation}
                loading={locationsLoading}
              />
            ) : (
              <ParkingMapView
                slots={slots}
                onSlotClick={handleSlotClick}
                emptyCount={emptyCount}
                filledCount={filledCount}
                disabled={isSessionActive}
                selectedSlotId={currentView !== "map" ? session.slotId : undefined}
                locationName={selectedLocation?.name}
                locationSubtitle={`${selectedLocation?.full_name || ""}`}
                onBack={!isSessionActive ? handleBackToLocations : undefined}
              />
            )}
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
                {currentView === "locations" ? "Pilih Lokasi Parkir" : "Pilih Slot Parkir"}
              </h2>
              <p className="text-sm text-gray-400 max-w-[280px] leading-relaxed">
                {currentView === "locations"
                  ? "Pilih salah satu lokasi parkir di panel kiri untuk melihat ketersediaan slot."
                  : "Klik salah satu slot yang tersedia di panel kiri untuk melihat detail dan melakukan reservasi."}
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
