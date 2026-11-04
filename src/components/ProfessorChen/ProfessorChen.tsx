import { PixelArt } from '../PixelArt/PixelArt'
import './ProfessorChen.scss'

const CHEN = [
  '................',
  '.....HHHHHH.....',
  '....HHHHHHHH....',
  '...HHHHHHHHHH...',
  '...HSSSSSSSSH...',
  '...HSSSSSSSSH...',
  '...HSSKSSKSSH...',
  '...HSSSSSSSSH...',
  '....SSSMMSSS....',
  '.....SSSSSS.....',
  '......SSSS......',
  '..CCCCCTTCCCCC..',
  '.CCCCCCTTCCCCCC.',
  '.CCCCCCTTCCCCCC.',
  '.CCCCCCTTCCCCCC.',
  '.CCCCCCTTCCCCCC.',
]

const CHEN_PIXELS = {
  H: 'professor-chen__hair',
  S: 'professor-chen__skin',
  K: 'professor-chen__eye',
  M: 'professor-chen__mouth',
  C: 'professor-chen__coat',
  T: 'professor-chen__shirt',
}

interface ProfessorChenProps {
  size: 'large' | 'small'
}

export function ProfessorChen({ size }: ProfessorChenProps) {
  return (
    <div className="professor-chen" data-size={size}>
      <PixelArt
        className="professor-chen__art"
        rows={CHEN}
        pixelClasses={CHEN_PIXELS}
      />
    </div>
  )
}
