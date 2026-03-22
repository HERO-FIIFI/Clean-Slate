/**
 * BrowserProcessor — modal that runs WebLLM question generation
 * for a list of documents when in browser mode.
 *
 * Props:
 *   documents: [{id, name}]   — documents to process
 *   onDone: () => void        — called when all docs are processed
 *   onClose: () => void       — called if user dismisses
 */
import { useState, useEffect, useRef } from 'react'
import { loadEngine, generateQuestions, getLoadedModelId } from '../services/webllm'
import { getWebLLMModelId } from '../services/llm'
import { getDocumentChunks, createQuestion, updateDocumentStatus } from '../services/api'

export default function BrowserProcessor({ documents, onDone, onClose }) {
  const [phase, setPhase]         = useState('loading-model')  // loading-model | processing | done | error
  const [modelProgress, setModelProgress] = useState({ text: 'Preparing…', progress: 0 })
  const [currentDoc, setCurrentDoc]       = useState(null)
  const [docProgress, setDocProgress]     = useState({ done: 0, total: documents.length })
  const [errorMsg, setErrorMsg]   = useState(null)
  const cancelled = useRef(false)

  useEffect(() => {
    cancelled.current = false
    run()
    return () => { cancelled.current = true }
  }, [])

  async function run() {
    const modelId = getWebLLMModelId()

    // Step 1 — load (or reuse) the engine
    setPhase('loading-model')
    try {
      await loadEngine(modelId, (report) => setModelProgress(report))
    } catch (e) {
      setErrorMsg(`Failed to load model: ${e.message}`)
      setPhase('error')
      return
    }

    if (cancelled.current) return

    // Step 2 — process each document
    setPhase('processing')
    for (let i = 0; i < documents.length; i++) {
      if (cancelled.current) return
      const doc = documents[i]
      setCurrentDoc(doc.name)
      setDocProgress({ done: i, total: documents.length })

      try {
        // Mark as processing via API
        await updateDocumentStatus(doc.id, 'processing')

        const chunksRes = await getDocumentChunks(doc.id)
        const chunks = chunksRes.data.chunks

        let totalCreated = 0
        for (const chunk of chunks) {
          if (cancelled.current) return
          const questions = await generateQuestions(chunk.text, chunk.context, 3)
          for (const q of questions) {
            await createQuestion(doc.id, q.question, `From: ${doc.name} (${q.context})`, chunk.text.slice(0, 600))
            totalCreated++
          }
        }

        await updateDocumentStatus(doc.id, 'ready')
      } catch (e) {
        console.error(`Processing failed for ${doc.name}:`, e)
        await updateDocumentStatus(doc.id, 'error').catch(() => {})
      }
    }

    setDocProgress({ done: documents.length, total: documents.length })
    setPhase('done')
    setTimeout(onDone, 1200)
  }

  const progressPct = phase === 'loading-model'
    ? modelProgress.progress * 100
    : (docProgress.done / docProgress.total) * 100

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(248,247,244,0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <div className="glass-panel animate-in" style={{
        padding: '48px 40px', maxWidth: '480px', width: '100%', textAlign: 'center',
      }}>

        {(phase === 'loading-model' || phase === 'processing') && (
          <>
            <Spinner />
            <h2 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '20px', fontWeight: 400,
              marginTop: '24px', marginBottom: '10px',
            }}>
              {phase === 'loading-model' ? 'Loading your AI model' : 'Reading your documents'}
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '28px', lineHeight: 1.7 }}>
              {phase === 'loading-model'
                ? modelProgress.text
                : `${currentDoc} (${docProgress.done + 1} of ${docProgress.total})`}
            </p>

            {/* Progress bar */}
            <div style={{
              height: '3px', borderRadius: '2px',
              background: 'var(--border)', overflow: 'hidden', marginBottom: '24px',
            }}>
              <div style={{
                height: '100%',
                width: `${Math.round(progressPct)}%`,
                background: 'var(--accent)',
                borderRadius: '2px',
                transition: 'width 0.4s ease',
              }} />
            </div>

            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              ⬤ Running locally — nothing leaves your device
            </p>
          </>
        )}

        {phase === 'done' && (
          <>
            <div style={{ fontSize: '40px', marginBottom: '20px' }}>✓</div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 400 }}>
              Questions ready
            </h2>
          </>
        )}

        {phase === 'error' && (
          <>
            <div style={{ fontSize: '40px', marginBottom: '20px' }}>⚠️</div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 400, marginBottom: '12px' }}>
              Something went wrong
            </h2>
            <p style={{ fontSize: '13px', color: '#c0605b', marginBottom: '28px' }}>{errorMsg}</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={run}>Try Again</button>
              <button className="btn btn-secondary" onClick={onClose}>Close</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <div style={{
      width: '36px', height: '36px',
      border: '2px solid var(--border)',
      borderTopColor: 'var(--accent)',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
      margin: '0 auto',
    }} />
  )
}
