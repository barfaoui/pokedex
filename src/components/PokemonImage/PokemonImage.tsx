import { useState, type SyntheticEvent } from 'react'
import { BrokenImageIcon } from '../BrokenImageIcon/BrokenImageIcon'
import { pixelate } from './pixelate'
import './PokemonImage.scss'

const PIXEL_ART_SIZE = 64

interface PokemonImageProps {
  src: string
  name: string
}

interface Pixelated {
  src: string
  dataUrl: string | null
}

export function PokemonImage({ src, name }: PokemonImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const [pixelated, setPixelated] = useState<Pixelated | null>(null)
  const current = pixelated?.src === src ? pixelated : null

  if (failedSrc === src) {
    return (
      <div
        className="pokemon-image__placeholder"
        role="img"
        aria-label={`${name} (image unavailable)`}
      >
        <BrokenImageIcon />
      </div>
    )
  }

  function handleLoad(event: SyntheticEvent<HTMLImageElement>) {
    if (current) {
      return
    }
    let dataUrl: string | null = null
    try {
      dataUrl = pixelate(event.currentTarget, PIXEL_ART_SIZE)
    } catch {
      // Keep the original
    }
    setPixelated({ src, dataUrl })
  }

  return (
    <img
      className="pokemon-image"
      src={current?.dataUrl ?? src}
      alt={name}
      crossOrigin="anonymous"
      loading="lazy"
      data-ready={current !== null}
      onLoad={handleLoad}
      onError={() => setFailedSrc(src)}
    />
  )
}
