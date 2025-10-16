const FOTMOB_SEARCH = 'https://www.fotmob.com/api/search'

export function fplHeadshotUrl(photo?: string, size: '250x250' | '110x140' = '250x250') {
  if (!photo) return null
  const code = photo.split('.')[0]
  return `https://resources.premierleague.com/premierleague/photos/players/${size}/p${code}.png`
}

export function crestUrl(teamCode?: number, size: 120 | 100 | 50 = 120) {
  if (!teamCode) return null
  return `https://resources.premierleague.com/premierleague/badges/${size}/t${teamCode}.png`
}

export function fotmobImageUrl(id: number | string) {
  return `https://images.fotmob.com/image_resources/playerimages/${id}.png`
}

async function existsHEAD(url: string, revalidateSeconds = 60 * 60 * 24) {
  try {
    const res = await fetch(url, { method: 'HEAD', next: { revalidate: revalidateSeconds } })
    return res.ok
  } catch {
    return false
  }
}

type FotmobPlayer = { id: number; name: string; team?: string | { name?: string } }

async function searchFotmobPlayerId(name: string, teamHint?: string, revalidateSeconds = 60 * 60 * 24 * 7) {
  const url = `${FOTMOB_SEARCH}?q=${encodeURIComponent(name)}`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    next: { revalidate: revalidateSeconds },
  }).catch(() => null)
  if (!res || !res.ok) return null

  const json = await res.json().catch(() => null)
  // Struktur API boleh berbeza sedikit; cuba beberapa laluan
  const raw: FotmobPlayer[] =
    json?.players ??
    json?.result?.players ??
    json?.autoComplete?.players ??
    []

  if (!Array.isArray(raw) || raw.length === 0) return null

  const normalizeTeam = (t: any) =>
    typeof t === 'string' ? t : t?.name || ''

  const candidates = raw.map((p: any) => ({
    id: p.id,
    name: p.name,
    team: normalizeTeam(p.team),
  }))

  // Jika ada teamHint, pilih yang padan dahulu
  if (teamHint) {
    const hit = candidates.find(c =>
      c.team?.toLowerCase().includes(teamHint.toLowerCase())
    )
    if (hit) return hit.id
  }

  // Jika tiada hint padan, ambil calon pertama
  return candidates[0]?.id ?? null
}

export type ResolveOpts = {
  photo?: string // elements.photo (cth "12345.jpg")
  teamCode?: number // teams[].code
  name?: string // nama pemain (cth "Reinildo")
  teamNameHint?: string // nama/short kelab untuk tapis FotMob (cth "Sunderland")
  preferFplOnly?: boolean // jika true, jangan guna FotMob
}

export async function resolvePlayerImageUrl({
  photo,
  teamCode,
  name,
  teamNameHint,
  preferFplOnly = false,
}: ResolveOpts): Promise<{ src: string; source: 'fpl' | 'fotmob' | 'crest' | 'placeholder' }> {
  // 1) Cuba FPL headshot
  const fpl250 = fplHeadshotUrl(photo, '250x250')
  if (fpl250 && await existsHEAD(fpl250)) return { src: fpl250, source: 'fpl' }

  const fpl110 = fplHeadshotUrl(photo, '110x140')
  if (fpl110 && await existsHEAD(fpl110)) return { src: fpl110, source: 'fpl' }

  // 2) Jika dibenarkan, cuba FotMob
  if (!preferFplOnly && name) {
    const id = await searchFotmobPlayerId(name, teamNameHint)
    if (id) {
      const url = fotmobImageUrl(id)
      // FotMob images hampir selalu wujud, tapi semak sekali
      if (await existsHEAD(url)) return { src: url, source: 'fotmob' }
    }
  }

  // 3) Crest kelab
  const crest120 = crestUrl(teamCode, 120)
  if (crest120 && await existsHEAD(crest120)) return { src: crest120, source: 'crest' }

  // 4) Placeholder
  return { src: '/player-placeholder.svg', source: 'placeholder' }
}

export async function resolveManyImageUrls(
  items: { id: number | string; photo?: string; teamCode?: number; name?: string; teamNameHint?: string }[]
) {
  const map = new Map<number | string, { src: string; source: string }>()
  for (const it of items) {
    if (map.has(it.id)) continue
    const r = await resolvePlayerImageUrl({
      photo: it.photo,
      teamCode: it.teamCode,
      name: it.name,
      teamNameHint: it.teamNameHint,
    })
    map.set(it.id, r)
  }
  return map
}
