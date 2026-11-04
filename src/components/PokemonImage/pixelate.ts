/**
 * Redraws a loaded image at `size`×`size` pixels and returns it as a PNG data URL;
 * shown scaled up with `image-rendering: pixelated`, it becomes pixel art.
 * Throws when the image can't be read back (a server without CORS headers).
 */
export function pixelate(image: HTMLImageElement, size: number): string {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('No 2D canvas')
  }
  // Smoothing averages the colours of each block of the large image into one pixel.
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(image, 0, 0, size, size)

  const pixels = context.getImageData(0, 0, size, size)
  hardenEdges(pixels.data)
  context.putImageData(pixels, 0, 0)
  return canvas.toDataURL('image/png')
}

// Every pixel fully opaque or fully transparent, so outlines stay crisp instead of fading.
function hardenEdges(rgba: Uint8ClampedArray) {
  for (let alpha = 3; alpha < rgba.length; alpha += 4) {
    rgba[alpha] = rgba[alpha] < 128 ? 0 : 255
  }
}
