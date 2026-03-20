import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import FocusMode from './pages/FocusMode'
import Dashboard from './pages/Dashboard'
import Upload from './pages/Upload'
import Setup from './pages/Setup'
import Settings from './pages/Settings'
import { getOllamaStatus } from './services/api'
import { getLLMMode, LLM_MODES } from './services/llm'
import './styles/index.css'

function SetupGuard() {
  const navigate = useNavigate()

  useEffect(() => {
    if (localStorage.getItem('setupComplete')) return

    // Browser AI mode doesn't need Ollama
    if (getLLMMode() === LLM_MODES.BROWSER) {
      localStorage.setItem('setupComplete', '1')
      return
    }

    getOllamaStatus()
      .then(({ data }) => {
        if (!data.running || !data.model_available) navigate('/setup')
        else localStorage.setItem('setupComplete', '1')
      })
      .catch(() => navigate('/setup'))
  }, [])

  return null
}

function App() {
  return (
    <Router>
      <SetupGuard />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/focus" element={<FocusMode />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/setup" element={<Setup />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Router>
  )
}

export default App
