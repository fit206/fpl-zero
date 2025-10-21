import Image from 'next/image'
import { resolvePlayerImageUrl } from '@/lib/playerImages'

export default async function SmartPlayerImage({
  photo,
  teamCode,
  name,
  teamNameHint,
  size = 160,
  alt,
  className = '',
}: {
  photo?: string
  teamCode?: number
  name?: string
  teamNameHint?: string
  size?: number
  alt: string
  className?: string
}) {
  const { src } = await resolvePlayerImageUrl({ photo, teamCode, name, teamNameHint })
  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-white/5 ${className}`}
      style={{ width: size, height: size }}
    >
      <Image src={src} alt={alt} fill sizes={`${size}px`} className="object-contain" />
    </div>
  )
}
