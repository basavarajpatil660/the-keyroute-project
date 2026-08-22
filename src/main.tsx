import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Disable browser's native scroll restoration so we control it
if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual'
}

// Ensure page starts at top on initial load / refresh
window.scrollTo(0, 0)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
