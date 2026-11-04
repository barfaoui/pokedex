import { PixelArt } from '@/shared/PixelArt/PixelArt'
import './LabFilesWaiting.scss'

const CABINET = [
  '.##########.',
  '.#FFFFFFFF#.',
  '.#FFFHHFFF#.',
  '.#FFFFFFFF#.',
  '.##########.',
  '.#FFFFFFFF#.',
  '.#FFFHHFFF#.',
  '.#FFFFFFFF#.',
  '.##########.',
]

const FRAMES = [
  ['............', '............', '............', ...CABINET],
  ['............', '............', '...PPPPPP...', ...CABINET],
  ['............', '....PPPP....', '...PPPPPP...', ...CABINET],
]

const PIXELS = {
  '#': 'lab-files-waiting__outline',
  F: 'lab-files-waiting__cabinet',
  H: 'lab-files-waiting__handle',
  P: 'lab-files-waiting__paper',
}

export function LabFilesWaiting() {
  return (
    <section className="lab-files-waiting" aria-live="polite">
      <div className="lab-files-waiting__drawer" aria-hidden="true">
        {FRAMES.map((rows, frame) => (
          <div
            className="lab-files-waiting__frame"
            data-frame={frame}
            key={frame}
          >
            <PixelArt
              className="lab-files-waiting__art"
              rows={rows}
              pixelClasses={PIXELS}
            />
          </div>
        ))}
      </div>
      <p className="lab-files-waiting__message">
        Prof. Chen is digging through his lab files…
      </p>
    </section>
  )
}
