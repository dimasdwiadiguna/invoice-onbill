import Image from 'next/image'

type Props = {
  /** 'full' = color logo for light backgrounds, 'white' = white logo for dark backgrounds */
  variant?: 'full' | 'white'
  className?: string
  /** Display height in px (width scales automatically) */
  height?: number
}

export function Logo({ variant = 'full', className = '', height = 32 }: Props) {
  const src = variant === 'white' ? '/logo-white.png' : '/logo-full.png'
  return (
    <Image
      src={src}
      alt="Onbill"
      width={160}
      height={40}
      priority
      className={className}
      style={{ height: `${height}px`, width: 'auto' }}
    />
  )
}
