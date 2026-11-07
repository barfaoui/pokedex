import { PixelArt } from '@/shared/PixelArt/PixelArt'
import './AskAiIcon.scss'

const ASK_AI = [
  '...S.......S..',
  '..SSS.....SSS.',
  '...S.......S..',
  '....FFFF......',
  '..FFFFFFFF....',
  '..FFGWGGFF....',
  '.FFGWGGGGFF...',
  '.FFGGGGGGFF...',
  '.FFGGGGGGFF...',
  '..FFGGGGFF....',
  '..FFFFFFFFH...',
  '....FFFF.HHH..',
  '..........HHH.',
  '...........HHH',
]

const ASK_AI_PIXELS = {
  S: 'ask-ai-icon__sparkle',
  F: 'ask-ai-icon__frame',
  G: 'ask-ai-icon__glass',
  W: 'ask-ai-icon__glint',
  H: 'ask-ai-icon__handle',
}

interface AskAiIconProps {
  className: string
}

export function AskAiIcon({ className }: AskAiIconProps) {
  return (
    <PixelArt
      className={`ask-ai-icon ${className}`}
      rows={ASK_AI}
      pixelClasses={ASK_AI_PIXELS}
    />
  )
}
