/**
 * Unified LLM abstraction.
 *
 * Mode stored in localStorage under 'llmMode':
 *   'ollama'  — backend handles everything (default)
 *   'browser' — WebGPU/WebLLM runs in the browser; backend is DB-only
 *
 * Selected WebLLM model stored under 'webllmModelId'.
 */

export const LLM_MODES = {
  OLLAMA:  'ollama',
  BROWSER: 'browser',
}

export const DEFAULT_WEBLLM_MODEL = 'Llama-3.2-3B-Instruct-q4f32_1-MLC'

export function getLLMMode() {
  return localStorage.getItem('llmMode') || LLM_MODES.OLLAMA
}

export function setLLMMode(mode) {
  localStorage.setItem('llmMode', mode)
}

export function isBrowserMode() {
  return getLLMMode() === LLM_MODES.BROWSER
}

export function getWebLLMModelId() {
  return localStorage.getItem('webllmModelId') || DEFAULT_WEBLLM_MODEL
}

export function setWebLLMModelId(id) {
  localStorage.setItem('webllmModelId', id)
}
