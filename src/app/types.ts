export type SlotStatus = "empty" | "filled" | "reserved" | "active";

export interface ParkingSlot {
  id: string;
  label: string;
  status: SlotStatus;
  sublocation?: string;
  row_letter?: string;
  location_id?: string;
}

export interface ParkingLocation {
  id: string;
  name: string;
  full_name: string;
  address: string;
  total_slots: number;
  rate_per_hour: number;
  operating_hours: string;
  image_url?: string;
  // Computed from slots
  available_slots?: number;
}

export type AppView = "locations" | "map" | "detail" | "parking" | "checkout" | "success";

export type ParkingSubState = "navigating" | "active";

export interface ParkingSession {
  slotId: string;
  slotLabel: string;
  location: string;
  rate: number;
  startTime: Date | null;
  endTime: Date | null;
  elapsedSeconds: number;
}

export const RATE_PER_HOUR = 3000;
