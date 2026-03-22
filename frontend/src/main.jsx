import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/index.css'
import { getTheme, applyTheme } from './services/theme.js'

// Apply saved theme before first paint to avoid flash
applyTheme(getTheme())

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
