import PriceMovementsClient from './PriceMovementsClient'

export default async function PriceMovements() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/price-movements`, {
    // Fallback: jika tiada BASE_URL (dev), gunakan relative fetch semasa render server
    cache: 'no-store',
  }).catch(() => null)

  let initial
  if (res && res.ok) {
    initial = await res.json()
  } else {
    // Jika fetch relatif diperlukan (dev), cuba direct import lib
    const { getBootstrap, selectPriceMovements } = await import('@/lib/fpl')
    const { resolveManyImageUrls } = await import('@/lib/playerImages')
    const data = await getBootstrap(60)
    const { currentGW, risers, fallers } = selectPriceMovements(data, 50)
    const all = [...risers, ...fallers]
    
    const imageMap = await resolveManyImageUrls(
      all.map(p => ({
        id: p.id,
        photo: p.photo,
        teamCode: p.teamCode,
        name: p.name,
        teamNameHint: p.teamName,
      }))
    )

    const attach = (arr: typeof risers) =>
      arr.map(p => {
        const img = imageMap.get(p.id)
        return { ...p, imageUrl: img?.src ?? '/player-placeholder.svg', imageSource: img?.source ?? 'placeholder' }
      })

    initial = { 
      updatedAt: new Date().toISOString(), 
      currentGW, 
      risers: attach(risers), 
      fallers: attach(fallers) 
    }
  }

  return <PriceMovementsClient initial={initial} />
}
