import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { AuthProvider } from './auth/AuthProvider'
import ProtectedRoute from './components/ProtectedRoute'
import Scene from './components/Scene'
import LedgerPage from './pages/LedgerPage'
import LoginPage from './pages/LoginPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Scene />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/ledger"
            element={
              <ProtectedRoute>
                <LedgerPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/ledger" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
