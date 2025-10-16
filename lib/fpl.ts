export type Team = {
  id: number
  code: number // penting untuk badges/t{code}.png
  name: string
  short_name: string
}

export type Element = {
  id: number
  web_name: string
  first_name: string
  second_name: string
  photo: string
  now_cost: number // dalam 0.1m (contoh 76 => £7.6m)
  cost_change_event: number // perubahan harga dalam GW semasa (contoh 1 => +0.1m)
  cost_change_start: number
  transfers_in_event: number
  transfers_out_event: number
  team: number
  element_type: 1 | 2 | 3 | 4 // 1 GK, 2 DEF, 3 MID, 4 FWD
  status: string
}

export type Event = {
  id: number
  name: string
  is_current: boolean
}

export type Bootstrap = {
  elements: Element[]
  teams: Team[]
  events: Event[]
}

export const POSITIONS: Record<Element['element_type'], 'GK' | 'DEF' | 'MID' | 'FWD'> = {
  1: 'GK',
  2: 'DEF',
  3: 'MID',
  4: 'FWD',
}

export function playerPhotoUrl(photo: string, size = 110) {
  const code = photo.split('.')[0]
  return `https://resources.premierleague.com/premierleague/photos/players/${size}x140/p${code}.png`
}

export async function getBootstrap(revalidateSeconds = 60): Promise<Bootstrap> {
  const res = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/', {
    cache: 'no-store', // Bypass cache untuk elak 2MB limit
  })
  if (!res.ok) throw new Error(`FPL fetch failed: ${res.status}`)
  return res.json()
}

export function formatPriceM(v: number) {
  return `£${v.toFixed(1)}m`
}

export type Movement = {
  id: number
  name: string
  pos: 'GK' | 'DEF' | 'MID' | 'FWD'
  teamShort: string
  teamName: string
  newPrice: number
  prevPrice: number
  delta: number // +0.1 atau -0.1 (dalam juta)
  photo: string
  transfersInGW: number
  transfersOutGW: number
  teamCode?: number
}

export function selectPriceMovements(data: Bootstrap, limit = 50) {
  const teamMap = new Map<number, Team>(data.teams.map(t => [t.id, t]))
  const currentGW = data.events.find(e => e.is_current)?.id ?? data.events.at(-1)?.id ?? 0

  const toMovement = (e: Element): Movement => {
    const delta = e.cost_change_event / 10
    const newPrice = e.now_cost / 10
    const team = teamMap.get(e.team)
    return {
      id: e.id,
      name: e.web_name,
      pos: POSITIONS[e.element_type],
      teamShort: team?.short_name ?? '',
      teamName: team?.name ?? '',
      newPrice,
      prevPrice: newPrice - delta,
      delta,
      photo: e.photo,
      transfersInGW: e.transfers_in_event,
      transfersOutGW: e.transfers_out_event,
      teamCode: team?.code,
    }
  }

  const risers = data.elements
    .filter(e => e.cost_change_event > 0)
    .sort((a, b) => {
      const d = b.cost_change_event - a.cost_change_event // besar → kecil
      if (d !== 0) return d
      return b.transfers_in_event - a.transfers_in_event
    })
    .slice(0, limit)
    .map(toMovement)

  const fallers = data.elements
    .filter(e => e.cost_change_event < 0)
    .sort((a, b) => {
      const d = a.cost_change_event - b.cost_change_event // lebih negatif → dahulu
      if (d !== 0) return d
      return b.transfers_out_event - a.transfers_out_event
    })
    .slice(0, limit)
    .map(toMovement)

  return { currentGW, risers, fallers }
}
