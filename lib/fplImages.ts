export function headshotUrlFromPhoto(photo?: string, size: '250x250' | '110x140' = '250x250') {
  if (!photo) return null
  const code = photo.split('.')[0]
  return `https://resources.premierleague.com/premierleague/photos/players/${size}/p${code}.png`
}

export function crestUrlFromTeamCode(teamCode?: number, size: 120 | 100 | 50 = 120) {
  if (!teamCode) return null
  return `https://resources.premierleague.com/premierleague/badges/${size}/t${teamCode}.png`
}

async function exists(url: string) {
  try {
    const res = await fetch(url, { method: 'HEAD', next: { revalidate: 60 * 60 * 24 } }) // cache 24h
    return res.ok
  } catch {
    return false
  }
}

export type ResolveOpts = {
  photo?: string // elements.photo, cth "12345.jpg"
  teamCode?: number // teams[].code (bukan id)
}

export async function resolvePlayerImageUrl({ photo, teamCode }: ResolveOpts): Promise<string> {
  const candidates = [
    headshotUrlFromPhoto(photo, '250x250'),
    headshotUrlFromPhoto(photo, '110x140'),
    crestUrlFromTeamCode(teamCode, 120),
    crestUrlFromTeamCode(teamCode, 100),
    crestUrlFromTeamCode(teamCode, 50),
  ].filter(Boolean) as string[]

  for (const url of candidates) {
    if (await exists(url)) return url
  }
  return '/player-placeholder.svg'
}

export async function resolveManyImageUrls(
  items: { id: number | string; photo?: string; teamCode?: number }[]
) {
  const map = new Map<number | string, string>()
  for (const it of items) {
    if (map.has(it.id)) continue
    map.set(it.id, await resolvePlayerImageUrl({ photo: it.photo, teamCode: it.teamCode }))
  }
  return map
}
