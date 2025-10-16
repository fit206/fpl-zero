import { getBootstrap, selectPriceMovements } from '@/lib/fpl'
import { resolveManyImageUrls } from '@/lib/playerImages'

export const revalidate = 30

export async function GET() {
  try {
    const data = await getBootstrap(30)
    const { currentGW, risers, fallers } = selectPriceMovements(data, 50)
    const all = [...risers, ...fallers]

    const imageMap = await resolveManyImageUrls(
      all.map(p => ({
        id: p.id,
        photo: p.photo,
        teamCode: p.teamCode,
        name: p.name,                // penting: nama untuk carian FotMob
        teamNameHint: p.teamName,    // atau p.teamShort
      }))
    )

    const attach = (arr: typeof risers) =>
      arr.map(p => {
        const img = imageMap.get(p.id)
        return { ...p, imageUrl: img?.src ?? '/player-placeholder.svg', imageSource: img?.source ?? 'placeholder' }
      })

    return Response.json({
      updatedAt: new Date().toISOString(),
      currentGW,
      risers: attach(risers),
      fallers: attach(fallers),
    })
  } catch (e: any) {
    return Response.json({ error: e?.message ?? 'failed' }, { status: 500 })
  }
}
