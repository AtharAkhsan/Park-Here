export type SlotStatus = "empty" | "filled" | "reserved" | "active";

export interface ParkingSlot {
  id: string;
  label: string;
  status: SlotStatus;
}

export type AppView = "map" | "detail" | "parking" | "checkout" | "success";

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

export const SLOT_LOCATIONS: Record<string, string> = {
  A1: "Dekat Pintu Masuk",
  A2: "Dekat Pintu Masuk",
  A3: "Area Tengah",
  A4: "Area Tengah",
  A5: "Dekat Lift",
  A6: "Dekat Lift",
  B1: "Dekat Pintu Darurat",
  B2: "Area Tengah",
  B3: "Dekat Pintu Masuk",
  B4: "Dekat Lift",
  B5: "Area Belakang",
  B6: "Area Belakang",
  C1: "Dekat Pintu Darurat",
  C2: "Dekat Pintu Darurat",
  C3: "Area Tengah",
  C4: "Area Tengah",
  C5: "Dekat Lift",
  C6: "Dekat Lift",
};

export const INITIAL_SLOTS: ParkingSlot[] = [
  { id: "a1", label: "A1", status: "filled" },
  { id: "a2", label: "A2", status: "empty" },
  { id: "a3", label: "A3", status: "filled" },
  { id: "a4", label: "A4", status: "empty" },
  { id: "a5", label: "A5", status: "filled" },
  { id: "a6", label: "A6", status: "empty" },
  { id: "b1", label: "B1", status: "filled" },
  { id: "b2", label: "B2", status: "empty" },
  { id: "b3", label: "B3", status: "empty" },
  { id: "b4", label: "B4", status: "filled" },
  { id: "b5", label: "B5", status: "empty" },
  { id: "b6", label: "B6", status: "filled" },
  { id: "c1", label: "C1", status: "empty" },
  { id: "c2", label: "C2", status: "filled" },
  { id: "c3", label: "C3", status: "empty" },
  { id: "c4", label: "C4", status: "filled" },
  { id: "c5", label: "C5", status: "empty" },
  { id: "c6", label: "C6", status: "filled" },
];
