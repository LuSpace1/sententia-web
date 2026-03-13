import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './components/LandingPage'
import Login from './components/Login'
import Register from './components/Register'
import Chat from './components/Chat'

function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null)

  const handleLogin = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  const handleDemo = () => {
    const demoData = {
      username: 'Invitado',
      token: '1aa655afe79c414476a07608680446bec24976ad',
      isDemo: true
    }
    localStorage.setItem('user', JSON.stringify(demoData))
    setUser(demoData)
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage user={user} onLogout={handleLogout} onDemo={handleDemo} />} />
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/register" element={<Register onLogin={handleLogin} />} />
        <Route 
          path="/chat" 
          element={user ? <Chat user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} 
        />
      </Routes>
    </Router>
  )
}

export default App
