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
import { User } from "@supabase/supabase-js";
import { LogOut, Mail, Lock, UserPlus, LogIn, Eye, EyeOff } from "lucide-react";

export default function Home() {
  // ─── State Machine ───────────────────────────────────
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
    async function getSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setUser(session?.user ?? null);
      setAuthLoading(false);
    }

    getSession();
    fetchLocations();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ─── Fetch Active Session on Login ──────────────────
  useEffect(() => {
    async function fetchActiveSession() {
      if (!user) return;

      const { data, error } = await supabase
        .from("parking_sessions")
        .select("*, parking_slots(*), parking_locations(*)")
        .eq("user_id", user.id)
        .in("status", ["active", "reserved"])
        .order("start_time", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error fetching active session:", error);
        return;
      }

      if (data) {
        // Restore Session
        const startTime = new Date(data.start_time);
        const elapsedSeconds = data.status === "active"
          ? Math.max(0, Math.floor((new Date().getTime() - startTime.getTime()) / 1000))
          : 0;

        setSession({
          slotId: data.slot_id,
          slotLabel: data.parking_slots?.label || "",
          location: data.parking_slots?.sublocation || "Area Parkir",
          rate: data.parking_locations?.rate_per_hour || RATE_PER_HOUR,
          startTime: data.status === "active" ? startTime : null,
          endTime: null,
          elapsedSeconds,
        });

        // Restore Location context
        if (data.parking_locations) {
          setSelectedLocation(data.parking_locations);
          fetchSlotsForLocation(data.parking_locations.id);
        }

        setParkingSubState(data.status === "active" ? "active" : "navigating");
        setCurrentView("parking");
      }
    }

    fetchActiveSession();
  }, [user]);

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

    // Create parking session with reserved status
    const now = new Date();
    const { error: insertError } = await supabase.from("parking_sessions").insert({
      user_id: user?.id,
      slot_id: session.slotId,
      location_id: selectedLocation?.id,
      start_time: now.toISOString(),
      status: "reserved",
    });

    if (insertError) {
      console.error("Error inserting reserved session:", insertError);
    }

    setSlots((prev) =>
      prev.map((s) =>
        s.id === session.slotId ? { ...s, status: "reserved" as const } : s
      )
    );
    setParkingSubState("navigating");
    setCurrentView("parking");
  }, [session.slotId, selectedLocation, user]);

  const handleArrived = useCallback(async () => {
    const now = new Date();
    setSession((prev) => ({ ...prev, startTime: now, elapsedSeconds: 0 }));

    // Update slot status in Supabase
    await supabase
      .from("parking_slots")
      .update({ status: "active" })
      .eq("id", session.slotId);

    // Update existing parking session status to active
    const { error: updateError } = await supabase
      .from("parking_sessions")
      .update({
        start_time: now.toISOString(),
        status: "active",
      })
      .eq("user_id", user?.id)
      .eq("slot_id", session.slotId)
      .eq("status", "reserved");

    if (updateError) {
      console.error("Error updating active session:", updateError);
    }

    setSlots((prev) =>
      prev.map((s) =>
        s.id === session.slotId ? { ...s, status: "active" as const } : s
      )
    );
    setParkingSubState("active");
  }, [session.slotId, user]);

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
  const handleAuth = async () => {
    setAuthError(null);
    setAuthSuccess(null);
    setAuthSubmitting(true);
    if (isRegister) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      setAuthSubmitting(false);
      if (error) {
        setAuthError(error.message);
        return;
      }

      setAuthSuccess("Cek email kamu untuk verifikasi akun.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      setAuthSubmitting(false);
      if (error) {
        setAuthError(error.message);
        return;
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    handleReset();
  };
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
    <Image src="/logo.svg" alt="PARK-HERE" width={size} height={size} className="flex-shrink-0" priority />
  );

  if (authLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        Loading...
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen w-full flex items-center justify-center auth-background px-4 py-8">
        <div className="w-full max-w-[420px] relative z-10 animate-scaleIn">
          {/* Logo area */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center mb-4 animate-float">
              <Logo size={36} />
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">PARK-HERE</h1>
            <p className="text-gray-400 text-sm mt-1 font-medium">Smart Parking System</p>
          </div>

          {/* Auth card */}
          <div className="auth-card rounded-3xl p-6 sm:p-8 overflow-hidden">
            <div key={isRegister ? "register" : "login"} className="animate-fadeIn">
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                {isRegister ? "Buat Akun Baru" : "Selamat Datang"}
              </h2>
              <p className="text-gray-400 text-sm mb-6">
                {isRegister ? "Daftarkan akunmu untuk mulai parkir" : "Masuk ke akunmu untuk melanjutkan"}
              </p>

              {/* Error/Success messages */}
              {authError && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm animate-fadeIn">
                  {authError}
                </div>
              )}
              {authSuccess && (
                <div className="mb-4 p-3 rounded-xl bg-green-50 border border-green-100 text-green-600 text-sm animate-fadeIn">
                  {authSuccess}
                </div>
              )}

              <div className="space-y-4">
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="auth-email"
                    type="email"
                    placeholder="Alamat email"
                    className="w-full auth-input rounded-xl pl-11 pr-4 py-3.5 text-sm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                  />
                </div>

                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="auth-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Kata sandi"
                    className="w-full auth-input rounded-xl pl-11 pr-11 py-3.5 text-sm"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <button
                  id="btn-auth"
                  onClick={handleAuth}
                  disabled={authSubmitting || !email || !password}
                  className="w-full auth-btn rounded-xl py-3.5 text-[15px] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {authSubmitting ? (
                    <div className="w-5 h-5 border-2 border-gray-400 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {isRegister ? <UserPlus size={18} /> : <LogIn size={18} />}
                      {isRegister ? "Daftar" : "Masuk"}
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="auth-divider my-6">atau</div>

            <button
              onClick={() => {
                setIsRegister((prev) => !prev);
                setAuthError(null);
                setAuthSuccess(null);
              }}
              className="w-full text-sm text-gray-500 hover:text-gray-800 transition-all py-2 group"
            >
              {isRegister
                ? <>Sudah punya akun? <span className="font-bold text-gray-900 inline-block transition-transform duration-200 group-hover:scale-110 group-hover:text-black">Masuk</span></>
                : <>Belum punya akun? <span className="font-bold text-gray-900 inline-block transition-transform duration-200 group-hover:scale-110 group-hover:text-black">Daftar</span></>}
            </button>
          </div>

          {/* Demo Credentials */}
          <div className="mt-5">
            <p className="text-center text-gray-400 text-[11px] font-medium uppercase tracking-wider mb-2.5">Demo Credentials</p>
            <button
              onClick={() => {
                setEmail("demo@park.here");
                setPassword("demoparkhere321");
                setAuthError(null);
                setAuthSuccess(null);
              }}
              className="w-full glass-card rounded-xl p-3.5 flex items-center gap-3 hover:bg-gray-50 transition-all cursor-pointer border border-gray-100"
            >
              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                <Mail size={16} className="text-gray-500" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-gray-900">Demo</p>
                <p className="text-xs text-gray-400">demo@park.here</p>
              </div>
            </button>
          </div>

          {/* Footer */}
          <p className="text-center text-gray-300 text-xs mt-6">
            © 2026 PARK-HERE. All rights reserved.
          </p>
        </div>
      </main>
    );
  }
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
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-[10px] font-medium text-gray-400">
                Online
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="btn-logout"
            >
              <LogOut size={13} />
              Logout
            </button>
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
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-[10px] font-medium text-gray-400">
                  Online
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="btn-logout"
              >
                <LogOut size={13} />
                Logout
              </button>
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
