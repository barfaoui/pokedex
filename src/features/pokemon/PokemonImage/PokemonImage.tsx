import { useState, type SyntheticEvent } from 'react'
import { BrokenImageIcon } from '@/features/pokemon/BrokenImageIcon/BrokenImageIcon'
import { pixelatedPokemonsCache } from '@/features/pokemon/pixelated-pokemons-cache'
import { pixelate } from '@/features/pokemon/pixelate'
import './PokemonImage.scss'

const PIXEL_ART_SIZE = 64

interface PokemonImageProps {
  src: string
  name: string
  /** Next to the Pokémon's written name: hidden from screen readers so it isn't read twice. */
  decorative?: boolean
}

interface Pixelated {
  src: string
  dataUrl: string | null
}

export function PokemonImage({
  src,
  name,
  decorative = false,
}: PokemonImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const [pixelated, setPixelated] = useState<Pixelated | null>(null)
  const cached = pixelatedPokemonsCache.get(src)
  const current =
    pixelated?.src === src
      ? pixelated
      : cached !== undefined
        ? { src, dataUrl: cached }
        : null

  if (failedSrc === src) {
    return (
      <div
        className="pokemon-image__placeholder"
        role={decorative ? undefined : 'img'}
        aria-label={decorative ? undefined : `${name} (image unavailable)`}
        aria-hidden={decorative || undefined}
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
    pixelatedPokemonsCache.set(src, dataUrl)
    setPixelated({ src, dataUrl })
  }

  return (
    <img
      className="pokemon-image"
      src={current?.dataUrl ?? src}
      alt={decorative ? '' : name}
      crossOrigin="anonymous"
      loading="lazy"
      data-ready={current !== null}
      onLoad={handleLoad}
      onError={() => setFailedSrc(src)}
    />
  )
}
