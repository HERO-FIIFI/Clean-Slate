import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLLMMode, setLLMMode, LLM_MODES, getWebLLMModelId, setWebLLMModelId } from '../services/llm'
import { WEBLLM_MODELS } from '../services/webllm'
import { resetAllData, resetQuestions } from '../services/api'
import { THEMES, getTheme, setTheme } from '../services/theme'

export default function Settings() {
  const navigate = useNavigate()
  const [llmMode, setMode]          = useState(getLLMMode())
  const [modelId, setModelId]       = useState(getWebLLMModelId())
  const [resetState, setResetState] = useState('idle')  // idle | confirm-all | confirm-q | done
  const [saved, setSaved]           = useState(false)
  const [activeTheme, setActiveTheme] = useState(getTheme())

  const handleTheme = (id) => {
    setTheme(id)
    setActiveTheme(id)
  }

  const handleSave = () => {
    setLLMMode(llmMode)
    setWebLLMModelId(modelId)
    // If switching modes, force re-setup on next load
    localStorage.removeItem('setupComplete')
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleReset = async (type) => {
    setResetState('idle')
    try {
      if (type === 'all') await resetAllData()
      else await resetQuestions()
      setResetState('done')
      setTimeout(() => setResetState('idle'), 2500)
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div style={{ minHeight: '100vh', padding: '56px 32px', maxWidth: '640px', margin: '0 auto' }}>
      <button onClick={() => navigate('/')} style={ghostBtn}>← Library</button>

      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '30px', fontWeight: 400, margin: '24px 0 40px' }}>
        Settings
      </h1>

      {/* ── Appearance ── */}
      <Section title="Appearance">
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.7 }}>
          Choose a colour mode. All themes use the same glassmorphism design.
        </p>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {THEMES.map(t => (
            <button
              key={t.id}
              onClick={() => handleTheme(t.id)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: '8px', background: 'none', border: 'none', cursor: 'pointer',
                padding: '4px',
              }}
            >
              {/* Swatch */}
              <div style={{
                width: '44px', height: '44px', borderRadius: '50%',
                background: t.swatch.bg,
                border: activeTheme === t.id
                  ? `3px solid var(--accent)`
                  : '3px solid transparent',
                outline: activeTheme === t.id
                  ? '2px solid var(--accent)'
                  : '2px solid var(--border)',
                outlineOffset: '2px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                transition: 'all 0.2s',
                position: 'relative', overflow: 'hidden',
              }}>
                {/* Accent colour arc */}
                <div style={{
                  position: 'absolute', bottom: 0, right: 0,
                  width: '22px', height: '22px',
                  borderRadius: '50% 0 50% 0',
                  background: t.swatch.accent,
                  opacity: 0.85,
                }} />
              </div>
              <span style={{
                fontSize: '11px',
                color: activeTheme === t.id ? 'var(--accent)' : 'var(--text-muted)',
                fontWeight: activeTheme === t.id ? 500 : 400,
                transition: 'color 0.2s',
              }}>
                {t.label}
              </span>
            </button>
          ))}
        </div>
      </Section>

      {/* ── AI Engine ── */}
      <Section title="AI Engine">
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.7 }}>
          Switch how Clean Slate generates your questions. Changes take effect on next launch.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          <ModeRow
            selected={llmMode === LLM_MODES.OLLAMA}
            onClick={() => setMode(LLM_MODES.OLLAMA)}
            title="Ollama (Local Server)"
            sub="Larger models, faster inference"
          />
          <ModeRow
            selected={llmMode === LLM_MODES.BROWSER}
            onClick={() => setMode(LLM_MODES.BROWSER)}
            title="Browser AI (WebGPU)"
            sub="No install — runs in this tab"
          />
        </div>

        {llmMode === LLM_MODES.BROWSER && (
          <div style={{ animation: 'fade-in-up 0.25s ease both' }}>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
              WebLLM Model
            </p>
            {WEBLLM_MODELS.map(m => (
              <label key={m.id} style={{
                display: 'flex', gap: '10px', alignItems: 'flex-start',
                padding: '11px 14px', marginBottom: '8px', borderRadius: '10px',
                cursor: 'pointer',
                border: `1px solid ${modelId === m.id ? 'var(--accent)' : 'var(--border)'}`,
                background: modelId === m.id ? 'rgba(var(--accent-rgb),0.06)' : 'rgba(255,255,255,0.5)',
                transition: 'all 0.2s',
              }}>
                <input type="radio" name="model" value={m.id}
                  checked={modelId === m.id}
                  onChange={() => setModelId(m.id)}
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

        <button
          className="btn btn-primary"
          onClick={handleSave}
          style={{ marginTop: '8px' }}
        >
          {saved ? '✓ Saved' : 'Save & re-setup'}
        </button>
      </Section>

      {/* ── Data ── */}
      <Section title="Data">
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.7 }}>
          All data is stored locally on your machine.
        </p>

        {resetState === 'done' && (
          <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(91,156,110,0.1)', marginBottom: '16px', fontSize: '13px', color: '#5b9c6e', animation: 'fade-in-up 0.2s ease both' }}>
            ✓ Data cleared successfully
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {resetState === 'confirm-q' ? (
            <ConfirmRow
              message="Clear all questions and reviews? Documents stay."
              onConfirm={() => handleReset('questions')}
              onCancel={() => setResetState('idle')}
            />
          ) : (
            <DangerRow
              label="Reset review progress"
              sub="Removes all questions and reviews. Documents stay."
              onClick={() => setResetState('confirm-q')}
            />
          )}

          {resetState === 'confirm-all' ? (
            <ConfirmRow
              message="Delete everything — documents, questions, reviews? This cannot be undone."
              onConfirm={() => handleReset('all')}
              onCancel={() => setResetState('idle')}
            />
          ) : (
            <DangerRow
              label="Erase all data"
              sub="Removes all documents, questions, and reviews."
              onClick={() => setResetState('confirm-all')}
              destructive
            />
          )}
        </div>
      </Section>

      {/* ── About ── */}
      <Section title="About">
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          <strong>Clean Slate</strong> v1.0 — a mindful, local-first learning tool.<br />
          Your documents and questions never leave your machine.
        </p>
      </Section>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: '40px' }}>
      <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '16px' }}>
        {title}
      </p>
      <div className="glass-panel" style={{ padding: '24px 28px' }}>
        {children}
      </div>
    </div>
  )
}

function ModeRow({ selected, onClick, title, sub }) {
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '12px 14px', borderRadius: '10px', cursor: 'pointer',
      border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
      background: selected ? 'rgba(var(--accent-rgb),0.06)' : 'rgba(255,255,255,0.5)',
      transition: 'all 0.2s',
    }}>
      <div style={{
        width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0,
        border: `2px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
        background: selected ? 'var(--accent)' : 'transparent', transition: 'all 0.2s',
      }} />
      <div>
        <span style={{ fontSize: '13px', fontWeight: 500 }}>{title}</span>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>{sub}</span>
      </div>
    </div>
  )
}

function DangerRow({ label, sub, onClick, destructive }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '14px 0', borderBottom: '1px solid var(--border)',
    }}>
      <div>
        <p style={{ fontSize: '13px', fontWeight: 500, color: destructive ? '#c0605b' : 'var(--text-primary)' }}>{label}</p>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{sub}</p>
      </div>
      <button onClick={onClick} style={{
        background: 'none', border: `1px solid ${destructive ? 'rgba(192,96,91,0.3)' : 'var(--border)'}`,
        borderRadius: '8px', padding: '6px 14px', cursor: 'pointer',
        fontSize: '12px', color: destructive ? '#c0605b' : 'var(--text-secondary)',
        transition: 'all 0.2s', flexShrink: 0, marginLeft: '16px',
      }}>
        {destructive ? 'Erase' : 'Reset'}
      </button>
    </div>
  )
}

function ConfirmRow({ message, onConfirm, onCancel }) {
  return (
    <div style={{
      padding: '14px', borderRadius: '10px',
      border: '1px solid rgba(192,96,91,0.3)',
      background: 'rgba(192,96,91,0.04)',
      animation: 'fade-in-up 0.2s ease both',
    }}>
      <p style={{ fontSize: '13px', color: '#c0605b', marginBottom: '12px', lineHeight: 1.6 }}>{message}</p>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={onConfirm} className="btn" style={{
          background: '#c0605b', color: '#fff', fontSize: '12px', padding: '7px 16px',
        }}>Confirm</button>
        <button onClick={onCancel} className="btn btn-secondary" style={{ fontSize: '12px', padding: '7px 16px' }}>
          Cancel
        </button>
      </div>
    </div>
  )
}

const ghostBtn = {
  background: 'none', border: 'none', cursor: 'pointer',
  color: 'var(--text-muted)', fontSize: '13px', padding: 0,
  transition: 'color 0.2s', fontFamily: 'var(--font-sans)', display: 'block',
}
