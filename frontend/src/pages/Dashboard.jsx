import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { listDocuments, getPendingCount } from '../services/api'
import { THEMES, getTheme, setTheme } from '../services/theme'



// Ripeness ring using SVG stroke-dasharray technique
function RipenessRing({ due, total, size = 64 }) {
  const radius = (size - 8) / 2
  const circumference = 2 * Math.PI * radius
  const pct = total > 0 ? Math.min(due / total, 1) : 0
  const offset = circumference * (1 - pct)
  const color = pct === 0 ? 'var(--text-muted)' : pct < 0.5 ? 'var(--accent-light)' : 'var(--accent)'

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={4} />
      <circle cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke={color} strokeWidth={4}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  )
}

function KnowledgeStone({ doc, onBegin }) {
  const [hovered, setHovered] = useState(false)
  const isDue = doc.due_count > 0
  const isProcessing = doc.status === 'processing' || doc.status === 'pending'
  const isError = doc.status === 'error'
  const canBegin = isDue && !isProcessing && !isError

  return (
    <div
      className="animate-in"
      style={{
        background: 'rgba(255,255,255,0.6)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: `1px solid ${isDue ? 'rgba(var(--accent-rgb),0.25)' : 'var(--border-stone)'}`,
        borderRadius: '20px',
        padding: '28px 24px',
        cursor: canBegin ? 'pointer' : 'default',
        transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: hovered && canBegin
          ? 'rgba(var(--accent-rgb),0.18) 0 8px 32px'
          : isDue ? 'rgba(var(--accent-rgb),0.12) 0 4px 24px' : 'var(--shadow)',
        opacity: isProcessing ? 0.7 : 1,
        transform: hovered && canBegin ? 'translateY(-3px)' : 'translateY(0)',
        position: 'relative', overflow: 'hidden',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => canBegin && onBegin(doc)}
    >
      {/* Top row: name + ring */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '15px',
            fontWeight: 500,
            color: 'var(--text-primary)',
            lineHeight: 1.4,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {doc.name.replace(/\.[^.]+$/, '')}
          </p>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>
            {doc.name.split('.').pop().toUpperCase()}
          </p>
        </div>
        {!isProcessing && !isError && (
          <RipenessRing due={doc.due_count} total={doc.question_count} />
        )}
        {isProcessing && <Spinner size={20} />}
      </div>

      {/* Bottom row: status info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {isProcessing ? 'Generating questions…'
            : isError ? 'Processing failed'
            : `${doc.question_count} questions`}
        </span>
        {isDue && !isProcessing && (
          <span style={{
            fontSize: '11px', fontWeight: 500, color: 'var(--accent)',
            background: 'rgba(var(--accent-rgb),0.08)', padding: '3px 9px', borderRadius: '999px',
          }}>
            {doc.due_count} due
          </span>
        )}
        {!isDue && !isProcessing && doc.question_count > 0 && (
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>at rest</span>
        )}
      </div>

      {/* "Begin ritual" overlay on hover */}
      {canBegin && hovered && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '20px',
          background: 'rgba(91,124,153,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'soft-appear 0.2s ease both',
          pointerEvents: 'none',
        }}>
          <span style={{
            fontFamily: 'var(--font-serif)', fontSize: '15px',
            color: 'var(--accent)', letterSpacing: '0.3px',
          }}>
            Begin ritual →
          </span>
        </div>
      )}
    </div>
  )
}

function Spinner({ size = 16 }) {
  return (
    <div style={{
      width: size, height: size,
      border: '2px solid var(--border)',
      borderTopColor: 'var(--accent)',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
      flexShrink: 0,
    }} />
  )
}

export default function Dashboard() {
  const [documents, setDocuments] = useState([])
  const [totalDue, setTotalDue] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTheme, setActiveTheme] = useState(getTheme())
  const navigate = useNavigate()

  const handleTheme = (id) => {
    setTheme(id)
    setActiveTheme(id)
  }

  useEffect(() => {
    Promise.all([listDocuments(), getPendingCount()])
      .then(([docsRes, pendingRes]) => {
        setDocuments(docsRes.data.documents)
        setTotalDue(pendingRes.data.count)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const hasDocuments = documents.length > 0
  const hasProcessing = documents.some(d => d.status === 'pending' || d.status === 'processing')

  return (
    <div style={{ minHeight: '100vh', padding: '56px 32px', maxWidth: '1100px', margin: '0 auto' }}>

      {/* Header */}
      <header style={{ marginBottom: '56px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '34px',
            fontWeight: 400,
            letterSpacing: '-0.5px',
            marginBottom: '6px',
          }}>
            Clean Slate
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Your knowledge library
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Theme dots */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {THEMES.map(t => (
              <button
                key={t.id}
                onClick={() => handleTheme(t.id)}
                title={t.label}
                style={{
                  width: '16px', height: '16px', borderRadius: '50%',
                  background: t.swatch.bg,
                  border: activeTheme === t.id
                    ? `2px solid var(--accent)`
                    : `2px solid var(--border)`,
                  boxShadow: activeTheme === t.id
                    ? '0 0 0 1.5px var(--accent)'
                    : 'none',
                  cursor: 'pointer', padding: 0,
                  transition: 'all 0.2s',
                  outline: 'none',
                  flexShrink: 0,
                }}
              />
            ))}
          </div>
          <span className="privacy-badge">⬤ Local only</span>
          <button onClick={() => navigate('/settings')} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', fontSize: '13px', padding: '8px',
            transition: 'color 0.2s',
          }}
            onMouseEnter={e => e.target.style.color = 'var(--text-secondary)'}
            onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
          >
            Settings
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/upload')} style={{ fontSize: '13px' }}>
            + Add document
          </button>
        </div>
      </header>

      {/* Start session banner — only when questions are due */}
      {!loading && totalDue > 0 && (
        <div
          className="animate-in"
          style={{
            background: 'linear-gradient(135deg, rgba(var(--accent-rgb),0.12) 0%, rgba(var(--accent-rgb),0.04) 100%)',
            border: '1px solid rgba(var(--accent-rgb),0.20)',
            borderRadius: '20px',
            padding: '28px 32px',
            marginBottom: '40px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '24px',
          }}
        >
          <div>
            <p style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '20px',
              fontWeight: 400,
              marginBottom: '4px',
            }}>
              {totalDue} question{totalDue !== 1 ? 's' : ''} await your attention
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Your study sanctuary is ready
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/focus')}>
            Begin ritual
          </button>
        </div>
      )}

      {/* Library grid */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '80px' }}>
          <Spinner size={28} />
        </div>
      )}

      {!loading && !hasDocuments && (
        <div style={{ textAlign: 'center', paddingTop: '100px' }}>
          <p style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '22px',
            fontWeight: 400,
            color: 'var(--text-secondary)',
            marginBottom: '12px',
          }}>
            Your library is empty
          </p>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '32px' }}>
            Upload a PDF or Markdown file to place your first knowledge stone
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/upload')}>
            Upload your first document
          </button>
        </div>
      )}

      {!loading && hasDocuments && (
        <>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            Knowledge Library — {documents.length} stone{documents.length !== 1 ? 's' : ''}
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '16px',
          }}>
            {documents.map((doc) => (
              <KnowledgeStone
                key={doc.id}
                doc={doc}
                onBegin={(d) => navigate(`/focus?doc=${d.id}`)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
