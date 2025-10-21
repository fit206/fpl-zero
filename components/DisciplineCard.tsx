import SmartPlayerImage from '@/components/SmartPlayerImage'

export default function DisciplineCard({
  name,
  info,
  photo, // elements.photo, contoh "12345.jpg"
  teamCode, // teams[].code (bukan id)
  teamShort,
  teamName,
}: {
  name: string
  info: string
  photo?: string
  teamCode?: number
  teamShort?: string
  teamName?: string
}) {
  return (
    <article className="rounded-2xl bg-white text-neutral-900 p-4">
      <div className="flex items-start gap-4">
        <SmartPlayerImage 
          photo={photo} 
          teamCode={teamCode} 
          name={name}
          teamNameHint={teamName || teamShort}
          alt={name} 
          size={120} 
        />
        <div className="min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold truncate">{name}</h4>
            {teamShort && <span className="text-xs font-bold text-neutral-500">{teamShort}</span>}
          </div>
          <p className="mt-1 text-sm text-neutral-700">{info}</p>
        </div>
      </div>
    </article>
  )
}
