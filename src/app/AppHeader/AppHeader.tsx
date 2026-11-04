import type { ReactNode } from 'react'
import { PixelArt } from '@/shared/PixelArt/PixelArt'
import './AppHeader.scss'

const BALL = [
  '....####....',
  '..##RRRR##..',
  '.#RWRRRRRR#.',
  '.#RRRRRRRR#.',
  '#RRR####RRR#',
  '####WWWW####',
  '####WWWW####',
  '#WWW####WWW#',
  '.#WWWWWWWW#.',
  '.#WWWWWWWW#.',
  '..##WWWW##..',
  '....####....',
]

const BALL_PIXELS = {
  '#': 'app-header__ball-outline',
  R: 'app-header__ball-top',
  W: 'app-header__ball-light',
}

interface AppHeaderProps {
  children?: ReactNode
}

export function AppHeader({ children }: AppHeaderProps) {
  return (
    <header className="app-header">
      <p className="app-header__brand">
        <PixelArt
          className="app-header__logo"
          rows={BALL}
          pixelClasses={BALL_PIXELS}
        />
        Okido Institute
      </p>
      {children}
    </header>
  )
}
