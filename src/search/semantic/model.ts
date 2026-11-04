// Shared by the dev-time script, the worker and the real-model tests, so all three embed alike.
export const MODEL_ID = 'Xenova/all-MiniLM-L12-v2'
/** model_quantized.onnx: 33 MB instead of 130 MB, for nearly the same embeddings. */
export const MODEL_DTYPE = 'q8'
export const EMBEDDING_SIZE = 384
export const EMBED_OPTIONS = { pooling: 'mean', normalize: true } as const

export type TextSource = 'short' | 'full' | 'description'

/** Row i of the embeddings file. */
export interface EmbeddedText {
  kind: 'move' | 'ability' | 'pokemon'
  name: string
  source: TextSource
}
