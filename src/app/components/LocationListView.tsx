"use client";

import { ParkingLocation } from "../types";
import { MapPin, Car, Search, ChevronRight, Banknote, Clock } from "lucide-react";
import { useState } from "react";

interface LocationListViewProps {
  locations: ParkingLocation[];
  onSelectLocation: (location: ParkingLocation) => void;
  loading?: boolean;
}

export default function LocationListView({
  locations,
  onSelectLocation,
  loading = false,
}: LocationListViewProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = locations.filter(
    (loc) =>
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="view-enter flex flex-col h-full">
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[11px] font-semibold tracking-widest uppercase text-gray-400">
              Real-time
            </span>
          </div>
          <h1 className="text-[22px] font-black tracking-tight leading-tight text-gray-900">
            Pilih Lokasi Parkir
          </h1>
          <p className="text-gray-400 text-sm font-medium mt-0.5">
            Memuat data lokasi...
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-gray-200 border-t-gray-900 animate-spin" />
            <span className="text-sm text-gray-400 font-medium">Memuat...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="view-enter flex flex-col h-full">
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[11px] font-semibold tracking-widest uppercase text-gray-400">
            Real-time
          </span>
        </div>
        <h1 className="text-[22px] font-black tracking-tight leading-tight text-gray-900">
          Pilih Lokasi Parkir
        </h1>
        <p className="text-gray-400 text-sm font-medium mt-0.5">
          {locations.length} lokasi tersedia di Universitas Brawijaya
        </p>
      </div>

      {/* Search */}
      <div className="px-5 mb-4">
        <div className="glass-card rounded-xl flex items-center gap-3 px-4 py-3">
          <Search size={16} className="text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Cari lokasi parkir..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm font-medium text-gray-900 placeholder-gray-400 outline-none"
          />
        </div>
      </div>

      {/* Location Cards */}
      <div className="flex-1 px-5 overflow-y-auto pb-6">
        <div className="space-y-3 stagger-children">
          {filtered.map((location) => {
            const available = location.available_slots ?? 0;
            const total = location.total_slots;
            const occupancyPercent = total > 0 ? ((total - available) / total) * 100 : 0;
            const isFull = available === 0;

            return (
              <button
                key={location.id}
                id={`location-${location.id}`}
                onClick={() => !isFull && onSelectLocation(location)}
                disabled={isFull}
                className={`w-full text-left glass-card rounded-2xl p-4 transition-all duration-300 group ${
                  isFull
                    ? "opacity-60 cursor-not-allowed"
                    : "hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                }`}
              >
                {/* Top row: Name + Arrow */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-1">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isFull ? "bg-pink-50" : "bg-green-50"
                      }`}>
                        <MapPin size={16} className={isFull ? "text-pink-400" : "text-green-500"} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-[15px] font-black tracking-tight text-gray-900 leading-none">
                          {location.name}
                        </h3>
                        <p className="text-[11px] text-gray-400 font-medium mt-0.5 truncate">
                          {location.full_name}
                        </p>
                      </div>
                    </div>
                  </div>
                  {!isFull && (
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-gray-900 group-hover:text-white transition-all">
                      <ChevronRight size={16} className="text-gray-400 group-hover:text-white transition-colors" />
                    </div>
                  )}
                </div>

                {/* Occupancy bar */}
                <div className="mb-3">
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        occupancyPercent > 80
                          ? "bg-pink-400"
                          : occupancyPercent > 50
                          ? "bg-amber-400"
                          : "bg-green-500"
                      }`}
                      style={{ width: `${occupancyPercent}%` }}
                    />
                  </div>
                </div>

                {/* Bottom stats */}
                <div className="flex items-center flex-wrap gap-x-4 gap-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Car size={12} className="text-gray-400 flex-shrink-0" />
                    <span className="text-[11px] font-semibold text-gray-500 whitespace-nowrap">
                      <span className={`font-black ${isFull ? "text-pink-500" : "text-green-600"}`}>
                        {available}
                      </span>
                      /{total} tersedia
                    </span>
                  </div>
                  <div className="w-px h-3 bg-gray-200 hidden sm:block" />
                  <div className="flex items-center gap-1.5">
                    <Banknote size={12} className="text-gray-400 flex-shrink-0" />
                    <span className="text-[11px] font-semibold text-gray-500 whitespace-nowrap">
                      Rp {location.rate_per_hour.toLocaleString("id-ID")}/jam
                    </span>
                  </div>
                  <div className="w-px h-3 bg-gray-200 hidden sm:block" />
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} className="text-gray-400 flex-shrink-0" />
                    <span className="text-[11px] font-semibold text-gray-500 whitespace-nowrap">
                      {location.operating_hours}
                    </span>
                  </div>
                </div>

                {/* Full badge */}
                {isFull && (
                  <div className="mt-3 flex items-center justify-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-pink-500 bg-pink-50 px-3 py-1 rounded-full">
                      Penuh
                    </span>
                  </div>
                )}
              </button>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-12">
              <Search size={32} className="text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-400">
                Lokasi tidak ditemukan
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
