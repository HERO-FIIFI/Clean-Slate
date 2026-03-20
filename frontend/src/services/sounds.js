/**
 * Ambient soundscapes via Web Audio API.
 * Generates noise algorithmically — no files, no network, fully local.
 */

let ctx = null
let gainNode = null
let sourceNode = null
let currentSound = null

export const SOUNDS = [
  { id: 'none',  label: 'Silence',     icon: '○' },
  { id: 'brown', label: 'Brown Noise', icon: '◉' },
  { id: 'white', label: 'White Noise', icon: '◎' },
  { id: 'pink',  label: 'Pink Noise',  icon: '◑' },
]

function getCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)()
    gainNode = ctx.createGain()
    gainNode.gain.value = 0.12
    gainNode.connect(ctx.destination)
  }
  return ctx
}

function buildNoiseBuffer(type) {
  const audioCtx = getCtx()
  const sampleRate = audioCtx.sampleRate
  const bufferSize = sampleRate * 3  // 3-second loop
  const buffer = audioCtx.createBuffer(1, bufferSize, sampleRate)
  const data = buffer.getChannelData(0)

  if (type === 'white') {
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }
  } else if (type === 'brown') {
    let last = 0
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1
      data[i] = (last + 0.02 * white) / 1.02
      last = data[i]
      data[i] *= 3.5
    }
  } else if (type === 'pink') {
    // Paul Kellet's pink noise approximation
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1
      b0 = 0.99886 * b0 + white * 0.0555179
      b1 = 0.99332 * b1 + white * 0.0750759
      b2 = 0.96900 * b2 + white * 0.1538520
      b3 = 0.86650 * b3 + white * 0.3104856
      b4 = 0.55000 * b4 + white * 0.5329522
      b5 = -0.7616 * b5 - white * 0.0168980
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11
      b6 = white * 0.115926
    }
  }

  return buffer
}

function stopCurrent() {
  if (sourceNode) {
    try { sourceNode.stop() } catch {}
    sourceNode.disconnect()
    sourceNode = null
  }
}

export function playSound(id) {
  if (id === currentSound) return
  stopCurrent()
  currentSound = id
  if (id === 'none') return

  const audioCtx = getCtx()
  if (audioCtx.state === 'suspended') audioCtx.resume()

  const buffer = buildNoiseBuffer(id)
  sourceNode = audioCtx.createBufferSource()
  sourceNode.buffer = buffer
  sourceNode.loop = true
  sourceNode.connect(gainNode)
  sourceNode.start()
}

export function stopSound() {
  stopCurrent()
  currentSound = null
}

export function setVolume(value) {  // 0–1
  if (gainNode) gainNode.gain.value = value * 0.25
}

export function getCurrentSound() {
  return currentSound
}
