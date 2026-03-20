import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getNextQuestion, rateConfidence, completeSession } from '../services/api'
import { SOUNDS, playSound, stopSound, getCurrentSound } from '../services/sounds'

const CONFIDENCE = [
  { key: 'hazy',   label: 'Hazy',   sub: "I'm guessing",          value: 1 },
  { key: 'steady', label: 'Steady', sub: 'I remember with effort', value: 3 },
  { key: 'clear',  label: 'Clear',  sub: 'This is part of me',     value: 5 },
]

export default function FocusMode() {
  const [searchParams]          = useSearchParams()
  const docId                   = searchParams.get('doc') ? Number(searchParams.get('doc')) : null

  const [question, setQuestion] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [exiting, setExiting]   = useState(false)
  const [chosen, setChosen]     = useState(null)
  const [done, setDone]         = useState(false)
  const [hintVisible, setHintVisible]       = useState(false)
  const [chunkVisible, setChunkVisible]     = useState(false)
  const [sound, setSound]       = useState(getCurrentSound() || 'none')
  const [showSounds, setShowSounds]         = useState(false)

  // Session tracking
  const session = useRef({ answered: 0, totalConf: 0, startTime: Date.now() })
  const [summary, setSummary]   = useState(null)  // set when done

  const navigate = useNavigate()

  const fetchNext = useCallback(() => {
    setLoading(true)
    setChosen(null)
    setHintVisible(false)
    setChunkVisible(false)
    const params = docId ? `?document_id=${docId}` : ''
    getNextQuestion(params)
      .then((res) => setQuestion(res.data))
      .catch(() => {
        // Session complete
        const elapsed = Math.round((Date.now() - session.current.startTime) / 1000)
        const { answered, totalConf } = session.current
        setSummary({
          answered,
          avgConf: answered > 0 ? (totalConf / answered).toFixed(1) : 0,
          minutes: Math.floor(elapsed / 60),
          seconds: elapsed % 60,
        })
        completeSession().catch(() => {})
        setDone(true)
      })
      .finally(() => setLoading(false))
  }, [docId])

  useEffect(() => { fetchNext() }, [fetchNext])

  // Stop sound when leaving
  useEffect(() => () => stopSound(), [])

  const handleRate = async (conf) => {
    if (!question || chosen) return
    setChosen(conf.key)
    session.current.answered += 1
    session.current.totalConf += conf.value

    try { await rateConfidence(question.id, conf.value) }
    catch (e) { console.error(e) }

    setExiting(true)
    setTimeout(() => { setExiting(false); fetchNext() }, 500)
  }

  const handleSound = (id) => {
    playSound(id)
    setSound(id)
    setShowSounds(false)
  }

  const confLabel = (val) => {
    if (val >= 4.5) return 'Clear'
    if (val >= 2.5) return 'Steady'
    return 'Hazy'
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-primary)',
      display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden',
    }}>

      {/* ── Breathing gradient ── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
        background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
        animation: 'breathe 4s ease-in-out infinite', transformOrigin: 'center',
      }} />

      {/* ── Top bar ── */}
      <div style={{
        position: 'absolute', top: '24px', left: '32px', right: '32px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <button onClick={() => navigate('/')} style={ghostBtn}>← Library</button>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Soundscape picker */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowSounds(v => !v)}
              style={{ ...ghostBtn, display: 'flex', alignItems: 'center', gap: '5px' }}
              title="Ambient sound"
            >
              {SOUNDS.find(s => s.id === sound)?.icon || '○'} Sound
            </button>
            {showSounds && (
              <div style={{
                position: 'absolute', top: '32px', right: 0,
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(16px)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '8px',
                zIndex: 10,
                minWidth: '160px',
                boxShadow: 'var(--shadow-glass)',
                animation: 'fade-in-up 0.2s ease both',
              }}>
                {SOUNDS.map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleSound(s.id)}
                    style={{
                      display: 'flex', gap: '10px', alignItems: 'center',
                      width: '100%', padding: '8px 12px', border: 'none',
                      background: sound === s.id ? 'rgba(91,124,153,0.1)' : 'none',
                      borderRadius: '8px', cursor: 'pointer',
                      fontSize: '13px', color: sound === s.id ? 'var(--accent)' : 'var(--text-primary)',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    <span>{s.icon}</span> {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <span className="privacy-badge">⬤ Local only</span>
        </div>
      </div>

      {/* ── Main ── */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '80px 24px',
      }}>
        <div style={{ width: '100%', maxWidth: '640px' }}>

          {loading && <div style={{ textAlign: 'center' }}><Spinner /></div>}

          {/* ── Session Summary ── */}
          {!loading && done && summary && (
            <div className="animate-in" style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '32px' }}>
                Session complete
              </p>
              <div className="glass-panel" style={{ padding: '48px 40px', marginBottom: '32px' }}>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: 400, marginBottom: '32px' }}>
                  Your slate is clear
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '8px' }}>
                  <StatBox label="Reviewed" value={summary.answered} />
                  <StatBox label="Avg feeling" value={confLabel(summary.avgConf)} />
                  <StatBox
                    label="Time"
                    value={summary.minutes > 0 ? `${summary.minutes}m ${summary.seconds}s` : `${summary.seconds}s`}
                  />
                </div>
              </div>
              <button className="btn btn-primary" onClick={() => navigate('/')}>
                Return to library
              </button>
            </div>
          )}

          {/* ── No summary (cold done) ── */}
          {!loading && done && !summary && (
            <div className="animate-in" style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: 400, marginBottom: '12px', color: 'var(--text-secondary)' }}>
                Nothing due right now
              </p>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '32px' }}>
                Your questions are all rested. Come back later.
              </p>
              <button className="btn btn-secondary" onClick={() => navigate('/')}>Return to library</button>
            </div>
          )}

          {/* ── Question card ── */}
          {!loading && !done && question && (
            <div style={{
              animation: exiting
                ? 'fade-out-up 0.45s cubic-bezier(0.4,0,0.2,1) both'
                : 'fade-in-up 0.45s cubic-bezier(0.4,0,0.2,1) both',
            }}>
              <p style={{
                fontSize: '11px', color: 'var(--text-muted)',
                letterSpacing: '0.8px', textTransform: 'uppercase',
                textAlign: 'center', marginBottom: '32px',
              }}>
                {question.context}
              </p>

              {/* Question glass card */}
              <div className="glass-panel" style={{ padding: '48px 40px', textAlign: 'center', marginBottom: '24px' }}>
                <h2 style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '24px', fontWeight: 400, lineHeight: 1.6,
                  marginBottom: (hintVisible || chunkVisible) ? '32px' : '0',
                }}>
                  {question.text}
                </h2>

                {/* Contextual reveal — actual source passage */}
                {chunkVisible && question.source_chunk && (
                  <div style={{
                    animation: 'soft-appear 0.4s ease both',
                    borderTop: '1px solid var(--border)', paddingTop: '24px',
                  }}>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '10px' }}>
                      Source passage
                    </p>
                    <p style={{
                      fontSize: '13px', color: 'var(--text-secondary)',
                      fontStyle: 'italic', lineHeight: 1.8,
                      textAlign: 'left',
                    }}>
                      "{question.source_chunk}"
                    </p>
                  </div>
                )}

                {/* Simple hint (context string) */}
                {hintVisible && !chunkVisible && (
                  <div style={{
                    animation: 'soft-appear 0.4s ease both',
                    borderTop: '1px solid var(--border)', paddingTop: '20px',
                  }}>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                      {question.context}
                    </p>
                  </div>
                )}
              </div>

              {/* Hint / Reveal buttons */}
              <div style={{ textAlign: 'center', marginBottom: '32px', display: 'flex', gap: '16px', justifyContent: 'center' }}>
                {!hintVisible && (
                  <button onClick={() => setHintVisible(true)} style={dottedBtn}>
                    Reveal hint
                  </button>
                )}
                {hintVisible && !chunkVisible && question.source_chunk && (
                  <button onClick={() => setChunkVisible(true)} style={dottedBtn}>
                    Show source passage
                  </button>
                )}
              </div>

              {/* Confidence */}
              <div>
                <p style={{
                  fontSize: '11px', color: 'var(--text-muted)',
                  letterSpacing: '0.8px', textTransform: 'uppercase',
                  textAlign: 'center', marginBottom: '16px',
                }}>
                  How did that feel?
                </p>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {CONFIDENCE.map((c) => (
                    <button
                      key={c.key}
                      onClick={() => handleRate(c)}
                      disabled={!!chosen}
                      className={`btn-ritual ${chosen === c.key ? 'selected' : ''}`}
                      style={{ opacity: chosen && chosen !== c.key ? 0.35 : 1 }}
                    >
                      <span style={{ fontFamily: 'var(--font-serif)', fontSize: '16px' }}>{c.label}</span>
                      <span className="ritual-label">{c.sub}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatBox({ label, value }) {
  return (
    <div>
      <p style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: 400, marginBottom: '4px' }}>
        {value}
      </p>
      <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </p>
    </div>
  )
}

function Spinner() {
  return (
    <div style={{
      width: '28px', height: '28px', border: '2px solid var(--border)',
      borderTopColor: 'var(--accent)', borderRadius: '50%',
      animation: 'spin 0.8s linear infinite', margin: '0 auto',
    }} />
  )
}

const ghostBtn = {
  background: 'none', border: 'none', cursor: 'pointer',
  color: 'var(--text-muted)', fontSize: '13px', padding: 0,
  transition: 'color 0.2s', fontFamily: 'var(--font-sans)',
}

const dottedBtn = {
  background: 'none', border: 'none', cursor: 'pointer',
  fontSize: '13px', color: 'var(--text-muted)',
  padding: '4px 8px', borderBottom: '1px dashed var(--border)',
  transition: 'color 0.2s', fontFamily: 'var(--font-sans)',
}
