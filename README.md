# 🅿️ PARK-HERE: Smart Parking Tracker

PARK-HERE is a modern, web-based prototype for a smart parking management system. It allows users to view real-time parking availability, reserve slots, track active parking sessions, and seamlessly handle checkout and billing.

## ✨ Features

- **Interactive Parking Map**: Real-time visual representation of parking slots categorized by status (Available, Occupied, Reserved, Active).
- **Responsive Split-View Architecture**: 
  - **Desktop**: Side-by-side layout ensuring the parking map remains contextually available while managing reservations on the right pane.
  - **Mobile**: Seamless single-column view optimized for mobile devices.
- **Session Tracking**: Live timer tracking exact parking duration down to the second.
- **Automated Billing**: Dynamic cost calculation based on elapsed time (Rp 3.000/hour).
- **Modern UI/UX**: Clean light theme with glassmorphism elements, intuitive color coding, and smooth view transitions.

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)

## 🚀 Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **Open the application:**
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Application Flow

1. **Select a Slot**: Click on an available (Kosong) slot on the map.
2. **Reserve**: View slot details and click "Reservasi Slot".
3. **Arrive**: Once at the parking location, click "Saya Sudah Sampai" to begin the live parking timer.
4. **Checkout**: Click "Selesai Parkir" to end the session. The system calculates the total duration and cost.
5. **Pay**: Select a payment method and confirm to complete the transaction.
