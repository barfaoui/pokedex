import type { EmbeddedText } from '@/search/semantic/model'
import { semanticResults, withQueryDirection } from '@/search/semantic/semantic'
import type { SearchResult } from '@/search/types/result'
import type {
  WorkerMessage,
  WorkerRequest,
} from '@/features/semantic/semantic.worker'

export type ModelStatus = 'loading' | 'ready' | 'failed'

interface SemanticClient {
  search: (query: string) => Promise<SearchResult[]>
}

let client: SemanticClient | undefined
// null until the first query that needs search by meaning starts the model
let status: ModelStatus | null = null
const listeners = new Set<() => void>()

/** One worker for the whole visit, started by the first query that needs it. */
export function semanticClient(): SemanticClient {
  client ??= createClient()
  return client
}

export function modelStatus(): ModelStatus | null {
  return status
}

export function onModelStatus(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function setStatus(next: ModelStatus) {
  status = next
  listeners.forEach((listener) => listener())
}

interface PendingQuery {
  resolve: (vector: Float32Array) => void
  reject: (reason: unknown) => void
}

async function fetchOk(url: string): Promise<Response> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`${url}: ${response.status}`)
  }
  return response
}

function createClient(): SemanticClient {
  setStatus('loading')
  const pending = new Map<number, PendingQuery>()
  let nextId = 0

  const base = import.meta.env.BASE_URL
  const embeddings = Promise.all([
    fetchOk(`${base}semantic/texts.json`).then(
      (response) => response.json() as Promise<EmbeddedText[]>,
    ),
    fetchOk(`${base}semantic/embeddings.bin`)
      .then((response) => response.arrayBuffer())
      .then((buffer) => new Float32Array(buffer)),
  ])

  // Queries waiting for a vector would otherwise never settle once the model is gone
  function fail(reason: unknown) {
    setStatus('failed')
    pending.forEach(({ reject }) => reject(reason))
    pending.clear()
  }

  const worker = new Worker(new URL('./semantic.worker.ts', import.meta.url), {
    type: 'module',
  })
  worker.onmessage = ({ data }: MessageEvent<WorkerMessage>) => {
    switch (data.type) {
      case 'ready':
        // The number for the docs: how long the first visit waits for search by meaning
        console.info(`Semantic search ready in ${Math.round(data.loadMs)} ms`)
        embeddings.then(() => setStatus('ready'), fail)
        break
      case 'failed':
        fail(data.reason)
        break
      case 'vector':
        pending.get(data.id)?.resolve(data.vector)
        pending.delete(data.id)
        break
    }
  }
  worker.onerror = (event) => fail(event.message)

  return {
    search: async (query) => {
      const id = nextId++
      const vector = await new Promise<Float32Array>((resolve, reject) => {
        pending.set(id, { resolve, reject })
        worker.postMessage({ id, query } satisfies WorkerRequest)
      })
      const [texts, vectors] = await embeddings
      return withQueryDirection(semanticResults(vector, texts, vectors), query)
    },
  }
}
