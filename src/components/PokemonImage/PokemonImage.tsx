import { useState } from 'react'
import { BrokenImageIcon } from '../BrokenImageIcon/BrokenImageIcon'
import './PokemonImage.scss'

interface PokemonImageProps {
  src: string
  name: string
}

export function PokemonImage({ src, name }: PokemonImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)

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

  return (
    <img
      className="pokemon-image"
      src={src}
      alt={name}
      loading="lazy"
      onError={() => setFailedSrc(src)}
    />
  )
}
