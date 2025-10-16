# FPL Transfer Advisor

Web app untuk mendapatkan cadangan transfer terbaik dalam Fantasy Premier League (FPL).

## Ciri-ciri

- **Input**: FPL Team ID (entryId)
- **Proses**: 
  - Mengambil data dari FPL API (tidak rasmi)
  - Mengira expected points (ePts) berdasarkan form, points per game, minutes probability, dan FDR multiplier
- **Output**: Top 5 cadangan single-transfer dengan patuh peraturan FPL

## Teknologi

- Next.js 14 (App Router)
- TypeScript
- TailwindCSS
- Server-side API routes untuk mengelak CORS

## Setup

1. Install dependencies:
```bash
npm install
```

2. Jalankan development server:
```bash
npm run dev
```

3. Buka [http://localhost:3000](http://localhost:3000)

## Penggunaan

1. Masukkan FPL Team ID anda
2. Klik "Dapatkan Cadangan"
3. Lihat cadangan transfer terbaik untuk gameweek semasa

## Algoritma ePts

Expected points dikira menggunakan formula:
- Base = 0.55 × form + 0.45 × points_per_game
- ePts = base × minutes_probability × avg_fdr_multiplier × position_multiplier

### Position Multipliers:
- GK: 1.0
- DEF: 1.0  
- MID: 1.05
- FWD: 1.07

### FDR Multipliers:
- 1: 1.15
- 2: 1.08
- 3: 1.00
- 4: 0.92
- 5: 0.85

## Peraturan Transfer

- Posisi sama (OUT → IN)
- Patuh bajet bank
- Had 3 pemain per kelab
- Tapis pemain injured
- Hanya single transfers

## Nota

- FPL API tidak rasmi - jangan spam endpoints
- Model ePts ringkas untuk rujukan sahaja
- Cadangan berdasarkan data semasa gameweek
