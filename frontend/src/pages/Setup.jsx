import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getOllamaStatus, pullOllamaModel } from '../services/api'
import { isWebGPUSupported, WEBLLM_MODELS, DEFAULT_MODEL_ID } from '../services/webllm'
import { setLLMMode, setWebLLMModelId, LLM_MODES } from '../services/llm'

/**
 * Steps:
 *  'choose-mode'   — pick Browser AI vs Ollama
 *  'checking'      — pinging Ollama
 *  'no-ollama'     — Ollama not running
 *  'no-model'      — Ollama running, model not pulled
 *  'downloading'   — pulling model
 *  'ready'         — all good, navigating
 */
export default function Setup() {
  const [step, setStep]             = useState('choose-mode')
  const [selectedMode, setMode]     = useState(null)
  const [selectedModel, setModel]   = useState(DEFAULT_MODEL_ID)
  const [ollamaModel, setOllamaModel] = useState('llama3.2')
  const [pullError, setPullError]   = useState(null)
  const pollRef = useRef(null)
  const navigate = useNavigate()

  const webGPUOk = isWebGPUSupported()

  /* ─── Ollama flow ──────────────────────────────── */
  const checkOllama = async () => {
    setStep('checking')
    try {
      const { data } = await getOllamaStatus()
      setOllamaModel(data.model || 'llama3.2')
      if (!data.running)          setStep('no-ollama')
      else if (data.model_available) finishSetup(LLM_MODES.OLLAMA)
      else if (data.pulling)      setStep('downloading')
      else                        setStep('no-model')
    } catch {
      setStep('no-ollama')
    }
  }

  const handlePull = async () => {
    setPullError(null)
    setStep('downloading')
    try { await pullOllamaModel() }
    catch { setPullError('Could not start download — is Ollama running?'); setStep('no-model') }
  }

  // Poll while pulling
  useEffect(() => {
    if (step === 'downloading') {
      pollRef.current = setInterval(async () => {
        try {
          const { data } = await getOllamaStatus()
          if (data.model_available) finishSetup(LLM_MODES.OLLAMA)
        } catch {}
      }, 3000)
    } else {
      clearInterval(pollRef.current)
    }
    return () => clearInterval(pollRef.current)
  }, [step])

  /* ─── Browser AI flow ──────────────────────────── */
  const handleBrowserMode = () => {
    setWebLLMModelId(selectedModel)
    finishSetup(LLM_MODES.BROWSER)
  }

  /* ─── Finish ───────────────────────────────────── */
  const finishSetup = (mode) => {
    setLLMMode(mode)
    localStorage.setItem('setupComplete', '1')
    setStep('ready')
    setTimeout(() => navigate('/'), 1600)
  }

  /* ─── Render ───────────────────────────────────── */
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg-primary)', padding: '24px',
    }}>
      <div className="glass-panel" style={{
        padding: '56px 48px', maxWidth: '580px', width: '100%', textAlign: 'center',
      }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: 400, marginBottom: '6px' }}>
          Clean Slate
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '48px', letterSpacing: '0.5px' }}>
          Your mindful learning space
        </p>

        {/* ── CHOOSE MODE ── */}
        {step === 'choose-mode' && (
          <div className="animate-in">
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 400, marginBottom: '8px' }}>
              Where should your AI live?
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: 1.7 }}>
              Either way, your documents never leave your machine.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '36px' }}>
              {/* Browser AI option */}
              <ModeCard
                selected={selectedMode === 'browser'}
                onClick={() => setMode('browser')}
                icon="🌐"
                title="Browser AI"
                badge={webGPUOk ? 'WebGPU ready' : 'WebGPU unavailable'}
                badgeOk={webGPUOk}
                description="Runs inside this tab — no install, no terminal. Downloads once, cached forever."
                disabled={!webGPUOk}
              />
              {/* Ollama option */}
              <ModeCard
                selected={selectedMode === 'ollama'}
                onClick={() => setMode('ollama')}
                icon="⚙️"
                title="Ollama (Local Server)"
                badge="More powerful"
                badgeOk
                description="Larger models, faster inference. Requires Ollama installed on your machine."
              />
            </div>

            {/* Browser AI — model picker */}
            {selectedMode === 'browser' && (
              <div style={{ marginBottom: '32px', textAlign: 'left', animation: 'fade-in-up 0.3s ease both' }}>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                  Choose your model
                </p>
                {WEBLLM_MODELS.map(m => (
                  <label key={m.id} style={{
                    display: 'flex', gap: '12px', alignItems: 'flex-start',
                    padding: '12px 14px', marginBottom: '8px',
                    borderRadius: '10px', cursor: 'pointer',
                    border: `1px solid ${selectedModel === m.id ? 'var(--accent)' : 'var(--border)'}`,
                    background: selectedModel === m.id ? 'rgba(91,124,153,0.06)' : 'rgba(255,255,255,0.5)',
                    transition: 'all 0.2s',
                  }}>
                    <input
                      type="radio" name="model" value={m.id}
                      checked={selectedModel === m.id}
                      onChange={() => setModel(m.id)}
                      style={{ marginTop: '2px', accentColor: 'var(--accent)' }}
                    />
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 500 }}>{m.label}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>{m.size}</span>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{m.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {selectedMode && (
              <button
                className="btn btn-primary"
                onClick={selectedMode === 'browser' ? handleBrowserMode : checkOllama}
              >
                {selectedMode === 'browser' ? 'Continue with Browser AI' : 'Continue with Ollama →'}
              </button>
            )}
          </div>
        )}

        {/* ── CHECKING ── */}
        {step === 'checking' && (
          <>
            <Spinner />
            <p style={{ color: 'var(--text-secondary)', marginTop: '24px', fontSize: '14px' }}>
              Checking Ollama…
            </p>
          </>
        )}

        {/* ── OLLAMA NOT RUNNING ── */}
        {step === 'no-ollama' && (
          <div className="animate-in">
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 400, marginBottom: '12px' }}>
              Ollama isn't running
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '28px', lineHeight: 1.7 }}>
              Start Ollama on your machine, then check again.
            </p>
            <div style={{ textAlign: 'left', marginBottom: '32px' }}>
              <StepItem n="1" text="Download Ollama from ollama.com" />
              <StepItem n="2" text="Install and launch it" />
              <StepItem n="3" code text="ollama serve" />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={checkOllama}>Check Again</button>
              <button className="btn btn-secondary" onClick={() => setStep('choose-mode')}>← Back</button>
            </div>
          </div>
        )}

        {/* ── MODEL NOT PULLED ── */}
        {step === 'no-model' && (
          <div className="animate-in">
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 400, marginBottom: '12px' }}>
              Download your AI model
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '8px', lineHeight: 1.7 }}>
              Ollama is running. <strong>{ollamaModel}</strong> (~2 GB) needs to be downloaded once.
            </p>
            {pullError && (
              <p style={{ color: '#c0605b', fontSize: '13px', marginBottom: '16px' }}>{pullError}</p>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '32px' }}>
              <button className="btn btn-primary" onClick={handlePull}>Download {ollamaModel}</button>
              <button className="btn btn-secondary" onClick={checkOllama}>Check Again</button>
            </div>
          </div>
        )}

        {/* ── DOWNLOADING ── */}
        {step === 'downloading' && (
          <div className="animate-in">
            <Spinner />
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 400, marginTop: '24px', marginBottom: '10px' }}>
              Downloading {ollamaModel}…
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.7 }}>
              This may take a few minutes. You can leave this tab open.
            </p>
            <div style={{ marginTop: '28px', height: '3px', borderRadius: '2px', background: 'var(--border)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: '40%', background: 'var(--accent)', borderRadius: '2px', animation: 'pulse-bar 1.8s ease-in-out infinite' }} />
            </div>
          </div>
        )}

        {/* ── READY ── */}
        {step === 'ready' && (
          <div className="animate-in">
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>✓</div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 400, marginBottom: '10px' }}>
              All set
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              Taking you to your library…
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-bar {
          0%, 100% { transform: translateX(-80%); }
          50% { transform: translateX(260%); }
        }
      `}</style>
    </div>
  )
}

function ModeCard({ selected, onClick, icon, title, badge, badgeOk, description, disabled }) {
  return (
    <div
      onClick={disabled ? undefined : onClick}
      style={{
        padding: '18px 20px', borderRadius: '14px', textAlign: 'left', cursor: disabled ? 'not-allowed' : 'pointer',
        border: `1.5px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
        background: selected ? 'rgba(91,124,153,0.07)' : 'rgba(255,255,255,0.5)',
        opacity: disabled ? 0.45 : 1,
        transition: 'all 0.2s',
        display: 'flex', gap: '14px', alignItems: 'flex-start',
      }}
    >
      <span style={{ fontSize: '22px', marginTop: '2px' }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontSize: '14px', fontWeight: 500 }}>{title}</span>
          <span style={{
            fontSize: '10px', padding: '2px 7px', borderRadius: '999px',
            background: badgeOk ? 'rgba(91,124,153,0.12)' : 'rgba(0,0,0,0.06)',
            color: badgeOk ? 'var(--accent)' : 'var(--text-muted)',
            letterSpacing: '0.3px',
          }}>{badge}</span>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{description}</p>
      </div>
      <div style={{
        width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0, marginTop: '2px',
        border: `2px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
        background: selected ? 'var(--accent)' : 'transparent',
        transition: 'all 0.2s',
      }} />
    </div>
  )
}

function StepItem({ n, text, code }) {
  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '10px' }}>
      <span style={{
        minWidth: '20px', height: '20px', borderRadius: '50%', background: 'var(--accent)',
        color: '#fff', fontSize: '11px', fontWeight: 600,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{n}</span>
      <span style={{ fontSize: '13px', color: 'var(--text-secondary)', paddingTop: '1px' }}>
        {code ? <code style={{ fontFamily: 'monospace', color: 'var(--accent)' }}>{text}</code> : text}
      </span>
    </div>
  )
}

function Spinner() {
  return (
    <div style={{
      width: '36px', height: '36px', border: '2px solid var(--border)',
      borderTopColor: 'var(--accent)', borderRadius: '50%',
      animation: 'spin 0.8s linear infinite', margin: '0 auto',
    }} />
  )
}
