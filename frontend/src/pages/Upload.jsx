import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { uploadDocument, listDocuments, deleteDocument, getDocumentStatus } from '../services/api'
import { isBrowserMode } from '../services/llm'
import BrowserProcessor from '../components/BrowserProcessor'

const STATUS = {
  pending:    { label: 'Queued',               color: 'var(--text-muted)' },
  processing: { label: 'Generating questions…', color: '#c09a3f' },
  ready:      { label: 'Ready',                 color: '#5b9c6e' },
  error:      { label: 'Error',                 color: '#c0605b' },
}

export default function Upload() {
  const [dragActive, setDragActive]   = useState(false)
  const [queue, setQueue]             = useState([])
  const [uploading, setUploading]     = useState(false)
  const [documents, setDocuments]     = useState([])
  const [processingDocs, setProcessingDocs] = useState(null)  // browser mode only
  const fileInputRef = useRef(null)
  const pollRef      = useRef(null)
  const navigate     = useNavigate()

  const fetchDocs = () =>
    listDocuments().then((r) => setDocuments(r.data.documents)).catch(console.error)

  useEffect(() => { fetchDocs() }, [])

  // Poll processing documents
  useEffect(() => {
    const busy = documents.filter(d => d.status === 'pending' || d.status === 'processing')
    if (!busy.length) { clearInterval(pollRef.current); return }

    pollRef.current = setInterval(async () => {
      const updates = await Promise.all(
        busy.map(d => getDocumentStatus(d.id).then(r => r.data).catch(() => null))
      )
      setDocuments(prev =>
        prev.map(doc => {
          const u = updates.find(x => x && x.id === doc.id)
          return u ? { ...doc, ...u, name: doc.name } : doc
        })
      )
    }, 3000)

    return () => clearInterval(pollRef.current)
  }, [documents])

  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }

  const addFiles = (list) => setQueue(p => [...p, ...Array.from(list)])

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files)
  }

  const handleUpload = async () => {
    setUploading(true)
    const uploaded = []
    for (const file of queue) {
      try {
        const res = await uploadDocument(file)
        uploaded.push({ id: res.data.id, name: res.data.filename })
      } catch (e) { console.error(`Upload failed: ${file.name}`, e) }
    }
    setQueue([])
    setUploading(false)
    await fetchDocs()

    // In browser mode, open the BrowserProcessor for newly uploaded docs
    if (isBrowserMode() && uploaded.length > 0) {
      setProcessingDocs(uploaded)
    }
  }

  return (
    <div style={{ minHeight: '100vh', padding: '56px 32px', maxWidth: '760px', margin: '0 auto' }}>
      {processingDocs && (
        <BrowserProcessor
          documents={processingDocs}
          onDone={() => { setProcessingDocs(null); fetchDocs() }}
          onClose={() => setProcessingDocs(null)}
        />
      )}

      {/* Header */}
      <div style={{ marginBottom: '48px' }}>
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', fontSize: '13px', padding: 0,
            marginBottom: '24px', display: 'block',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => e.target.style.color = 'var(--text-secondary)'}
          onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
        >
          ← Library
        </button>
        <h1 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '30px', fontWeight: 400,
          letterSpacing: '-0.3px', marginBottom: '8px',
        }}>
          Place your knowledge
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          Drop a PDF or Markdown file. Your local AI will read it and prepare questions for you.
        </p>
      </div>

      {/* Drop zone — "empty pool" */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          position: 'relative',
          padding: '80px 32px',
          textAlign: 'center',
          borderRadius: '24px',
          border: dragActive
            ? '1.5px solid var(--accent)'
            : '1.5px dashed rgba(0,0,0,0.12)',
          background: dragActive
            ? 'rgba(91,124,153,0.05)'
            : 'rgba(255,255,255,0.35)',
          backdropFilter: 'blur(8px)',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          marginBottom: '40px',
          overflow: 'hidden',
        }}
      >
        {/* Pool ripple effect when dragging */}
        {dragActive && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at center, rgba(91,124,153,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
        )}

        <div style={{
          width: '48px', height: '48px',
          borderRadius: '50%',
          border: '1.5px solid rgba(0,0,0,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
          fontSize: '20px',
          background: 'rgba(255,255,255,0.7)',
        }}>
          ↓
        </div>

        <p style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '18px', fontWeight: 400,
          color: dragActive ? 'var(--accent)' : 'var(--text-secondary)',
          marginBottom: '8px',
          transition: 'color 0.2s',
        }}>
          {dragActive ? 'Release to place' : 'Drop a document here'}
        </p>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          or click to browse — PDF or Markdown
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.md,.markdown"
          multiple
          onChange={(e) => e.target.files?.length && addFiles(e.target.files)}
          style={{ display: 'none' }}
        />
      </div>

      {/* Upload queue */}
      {queue.length > 0 && (
        <div style={{ marginBottom: '40px', animation: 'fade-in-up 0.35s ease both' }}>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '14px' }}>
            Ready to place
          </p>
          {queue.map((file, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 18px',
              marginBottom: '8px',
              background: 'rgba(255,255,255,0.6)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
            }}>
              <span style={{ fontSize: '14px' }}>{file.name}</span>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {(file.size / 1024).toFixed(1)} KB
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); setQueue(p => p.filter((_, j) => j !== i)) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '18px', lineHeight: 1 }}
                >×</button>
              </div>
            </div>
          ))}
          <button
            className="btn btn-primary"
            style={{ marginTop: '16px' }}
            onClick={handleUpload}
            disabled={uploading}
          >
            {uploading ? 'Placing…' : `Place ${queue.length} document${queue.length > 1 ? 's' : ''}`}
          </button>
        </div>
      )}

      {/* Existing documents */}
      {documents.length > 0 && (
        <div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '14px' }}>
            In your library
          </p>
          {documents.map((doc) => {
            const s = STATUS[doc.status] || STATUS.pending
            return (
              <div key={doc.name} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '14px 18px',
                marginBottom: '8px',
                background: 'rgba(255,255,255,0.6)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                transition: 'background 0.2s',
              }}>
                <div>
                  <span style={{ fontSize: '14px' }}>{doc.name}</span>
                  <span style={{ fontSize: '12px', color: s.color, marginLeft: '10px' }}>
                    {s.label}
                    {doc.status === 'ready' && doc.question_count > 0 && ` · ${doc.question_count} questions`}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {(doc.size / 1024).toFixed(1)} KB
                  </span>
                  <button
                    onClick={() => deleteDocument(doc.name).then(fetchDocs).catch(console.error)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '18px', lineHeight: 1 }}
                  >×</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
