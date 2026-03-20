/**
 * WebLLM service — runs a quantized LLM in the browser via WebGPU.
 * The engine is a singleton; it persists across the session.
 * The downloaded model is cached in the browser (IndexedDB) forever.
 */
import { CreateMLCEngine } from '@mlc-ai/web-llm'

// Available models — user picks during setup
export const WEBLLM_MODELS = [
  {
    id: 'Llama-3.2-1B-Instruct-q4f32_1-MLC',
    label: 'Fast  (1B)',
    size: '~700 MB',
    description: 'Instant responses, lighter questions',
  },
  {
    id: 'Llama-3.2-3B-Instruct-q4f32_1-MLC',
    label: 'Balanced  (3B)',
    size: '~2 GB',
    description: 'Best balance of quality and speed',
  },
  {
    id: 'Phi-3.5-mini-instruct-q4f32_1-MLC',
    label: 'Capable  (Phi-3.5)',
    size: '~2.2 GB',
    description: 'Best quality, slightly slower',
  },
]

export const DEFAULT_MODEL_ID = WEBLLM_MODELS[1].id  // Balanced

let _engine = null
let _loadedModelId = null

export function isWebGPUSupported() {
  return typeof navigator !== 'undefined' && !!navigator.gpu
}

/**
 * Load (or reuse) the WebLLM engine.
 * @param {string} modelId
 * @param {(report: {text: string, progress: number}) => void} onProgress
 */
export async function loadEngine(modelId, onProgress) {
  if (_engine && _loadedModelId === modelId) return _engine

  _engine = await CreateMLCEngine(modelId, {
    initProgressCallback: (report) => {
      onProgress?.({ text: report.text, progress: report.progress ?? 0 })
    },
  })
  _loadedModelId = modelId
  return _engine
}

const PROMPT = (n, text) => `\
You are a study assistant. Generate ${n} thoughtful study questions from the text below.

Return ONLY a valid JSON array — no explanation, nothing else:
[
  {"question": "...", "hint": "one short context phrase"}
]

Text:
${text.slice(0, 3000)}`

/**
 * Generate questions from a text chunk using the loaded engine.
 * @param {string} chunkText
 * @param {string} context  e.g. "Pages 1–3"
 * @param {number} n  number of questions
 * @returns {Promise<{question: string, context: string}[]>}
 */
export async function generateQuestions(chunkText, context, n = 3) {
  if (!_engine) throw new Error('Engine not loaded. Call loadEngine() first.')

  const reply = await _engine.chat.completions.create({
    messages: [{ role: 'user', content: PROMPT(n, chunkText) }],
    max_tokens: 600,
    temperature: 0.7,
  })

  const raw = reply.choices[0]?.message?.content ?? ''

  try {
    const match = raw.match(/\[[\s\S]*?\]/)
    if (!match) return []
    const items = JSON.parse(match[0])
    return items
      .filter(i => i.question?.trim())
      .map(i => ({
        question: i.question.trim(),
        context: `${context}${i.hint ? ` — ${i.hint}` : ''}`,
      }))
  } catch {
    return []
  }
}

export function getLoadedModelId() {
  return _loadedModelId
}
