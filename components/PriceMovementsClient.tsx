'use client'

import useSWR from 'swr'
import Image from 'next/image'
import { formatPriceM, Movement } from '@/lib/fpl'
import { useState } from 'react'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

type ApiData = {
  updatedAt: string
  currentGW: number
  risers: (Movement & { imageUrl: string; imageSource: string })[]
  fallers: (Movement & { imageUrl: string; imageSource: string })[]
}

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
})

export default function PriceMovementsClient({ initial }: { initial: ApiData }) {
  const { data, error, isLoading } = useSWR<ApiData>('/api/price-movements', fetcher, {
    refreshInterval: 60_000, // poll 60s
    dedupingInterval: 30_000,
    fallbackData: initial, // pastikan SSR == CSR semasa hydrate
    revalidateOnFocus: false,
  })

  const [tab, setTab] = useState<'rises' | 'falls'>('rises')
  const d = data ?? initial
  const list = tab === 'rises' ? d.risers : d.fallers

  return (
    <section className="w-full max-w-3xl rounded-2xl bg-black/60 p-4 text-white">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Live Player Price Movements</h3>
          <span className="rounded bg-white/10 px-2 py-0.5 text-xs">GW {d.currentGW}</span>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-white/10 p-1">
          <button
            className={`rounded-md px-3 py-1 text-sm ${tab === 'rises' ? 'bg-green-500/30 text-white' : 'text-white/80 hover:text-white'}`}
            onClick={() => setTab('rises')}
            aria-pressed={tab === 'rises'}
          >
            Rises
          </button>
          <button
            className={`rounded-md px-3 py-1 text-sm ${tab === 'falls' ? 'bg-red-500/30 text-white' : 'text-white/80 hover:text-white'}`}
            onClick={() => setTab('falls')}
            aria-pressed={tab === 'falls'}
          >
            Falls
          </button>
        </div>
      </header>

      {error && (
        <div className="rounded-lg border border-white/10 p-4 text-sm text-white/80">
          Gagal memuatkan data. Menggunakan cache terakhir.
        </div>
      )}

      {isLoading && !data && (
        <div className="h-[120px] animate-pulse rounded-lg bg-white/10" aria-hidden="true" />
      )}

      {list.length === 0 ? (
        <div className="rounded-lg border border-white/10 p-6 text-center text-white/80">
          Tiada pergerakan harga untuk tab ini setakat ini.
        </div>
      ) : (
        <ul role="list" className="divide-y divide-white/10">
          {list.map((p) => (
            <li key={p.id} className="flex items-center gap-3 py-3">
              <div className="relative h-[40px] w-[32px] overflow-hidden rounded">
                <Image
                  src={p.imageUrl}
                  alt={`Foto ${p.name}`}
                  fill
                  sizes="40px"
                  className="object-contain"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium">{p.name}</p>
                  {p.delta > 0 ? (
                    <span className="inline-flex items-center gap-1 rounded bg-green-500/20 px-2 py-0.5 text-xs text-green-200">
                      <ArrowUpRight className="h-3.5 w-3.5" /> +{p.delta.toFixed(1)}m
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded bg-red-500/20 px-2 py-0.5 text-xs text-red-200">
                      <ArrowDownRight className="h-3.5 w-3.5" /> {p.delta.toFixed(1)}m
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-white/80">
                  {p.teamShort} • {p.pos}
                </p>
              </div>

              <div className="text-right">
                <div className="text-sm text-white/70 line-through">{formatPriceM(p.prevPrice)}</div>
                <div className="text-base font-semibold">{formatPriceM(p.newPrice)}</div>
                <div className="text-[10px] opacity-60 mt-1">src: {p.imageSource}</div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <footer className="mt-3 flex items-center justify-between text-xs text-white/70">
        <span>Last update: {new Date(d.updatedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
        <span>Auto refresh: 60s</span>
      </footer>
    </section>
  )
}
