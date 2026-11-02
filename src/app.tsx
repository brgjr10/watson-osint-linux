import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { IconContext } from '@phosphor-icons/react'
import './index.css'
import AppLayout from './pages/app/AppLayout'
import { ErrorBoundary } from './components/ErrorBoundary'
import Search from './pages/app/Search'
import Results from './pages/app/Results'
import History from './pages/app/History'
import Toolkit from './pages/app/Toolkit'
import Cases from './pages/app/Cases'
import Help from './pages/app/Help'

// This entry only ever runs inside the desktop window, which loads from file://.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
    {/* Icons sit next to text that already names them, so hide them from screen readers. */}
    <IconContext.Provider value={{ 'aria-hidden': true }}>
      <HashRouter>
        <Routes>
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Search />} />
            <Route path="results" element={<Results />} />
            <Route path="history" element={<History />} />
            <Route path="toolkit" element={<Toolkit />} />
            <Route path="cases" element={<Cases />} />
            <Route path="help" element={<Help />} />
            <Route path="case/:id" element={<Cases />} />
          </Route>
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </HashRouter>
    </IconContext.Provider>
  </ErrorBoundary>
  </StrictMode>,
)
