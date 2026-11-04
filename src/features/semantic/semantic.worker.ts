/// <reference lib="webworker" />
// Embeds queries off the main thread, so typing never waits for the model.
import { env, pipeline } from '@huggingface/transformers'
import ortMjs from 'onnxruntime-web/ort-wasm-simd-threaded.asyncify.mjs?url'
import ortWasm from 'onnxruntime-web/ort-wasm-simd-threaded.asyncify.wasm?url'
import { EMBED_OPTIONS, MODEL_DTYPE, MODEL_ID } from '@/search/semantic/model'

export type WorkerRequest = { id: number; query: string }
export type WorkerMessage =
  | { type: 'ready'; loadMs: number }
  | { type: 'failed'; reason: string }
  | { type: 'vector'; id: number; vector: Float32Array }

// Everything comes from the app itself: the model from public/models/, the ONNX runtime from the
// bundle. Transformers.js would otherwise fetch them from Hugging Face and a CDN.
env.allowRemoteModels = false
env.allowLocalModels = true
env.localModelPath = `${import.meta.env.BASE_URL}models/`
const onnx = env.backends.onnx as { wasm?: { wasmPaths?: unknown } }
if (onnx.wasm) {
  onnx.wasm.wasmPaths = { mjs: ortMjs, wasm: ortWasm }
}

const scope = self as DedicatedWorkerGlobalScope
const started = performance.now()
const extractor = pipeline('feature-extraction', MODEL_ID, {
  dtype: MODEL_DTYPE,
})

extractor.then(
  () => post({ type: 'ready', loadMs: performance.now() - started }),
  (error: unknown) => post({ type: 'failed', reason: String(error) }),
)

scope.onmessage = async ({ data }: MessageEvent<WorkerRequest>) => {
  try {
    const embed = await extractor
    const output = await embed(data.query, EMBED_OPTIONS)
    post({ type: 'vector', id: data.id, vector: output.data as Float32Array })
  } catch (error) {
    post({ type: 'failed', reason: String(error) })
  }
}

function post(message: WorkerMessage) {
  scope.postMessage(message)
}
