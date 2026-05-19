# 🅿️ PARK-HERE: Smart Parking Tracker

PARK-HERE is a modern, web-based prototype for a smart parking management system. It allows users to view real-time parking availability across multiple locations, reserve slots, track active parking sessions, and seamlessly handle checkout and billing.

## ✨ Features

- **Multi-Location Support**: Browse and select from various parking locations (e.g., FILKOM, FEB, FTP, FMIPA, FK) with real-time occupancy indicators.
- **Real-Time Data**: Integrated with Supabase to provide live updates on parking slot availability across all locations.
- **Interactive Parking Map**: Visual representation of parking slots categorized by status (Available, Occupied, Reserved, Active).
- **Responsive Split-View Architecture**: 
  - **Desktop**: Side-by-side layout ensuring the parking map remains contextually available while managing reservations on the right pane.
  - **Mobile**: Seamless single-column view optimized for mobile devices.
- **Session Tracking**: Live timer tracking exact parking duration down to the second.
- **Automated Billing**: Dynamic cost calculation based on elapsed time and location-specific rates.
- **Modern UI/UX**: Clean light theme with glassmorphism elements, intuitive color coding, and smooth view transitions.

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Backend / Database**: [Supabase](https://supabase.com/) (PostgreSQL & Realtime)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)

## 🚀 Getting Started

1. **Clone the repository and install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Setup:**
   Create a `.env.local` file in the root directory and configure your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open the application:**
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Application Flow

1. **Select Location**: Browse the list of parking locations and select one to view its parking map.
2. **Select a Slot**: Click on an available (Kosong) slot on the map.
3. **Reserve**: View slot details (including location-specific rates) and click "Reservasi Slot".
4. **Arrive**: Once at the parking location, click "Saya Sudah Sampai" to begin the live parking timer.
5. **Checkout**: Click "Selesai Parkir" to end the session. The system calculates the total duration and cost.
6. **Pay**: Select a payment method and confirm to complete the transaction and receive a digital receipt.
