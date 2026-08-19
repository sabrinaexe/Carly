import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Notifications from './pages/Notifications'
import Alerts from './pages/Alerts'
import Profile from './pages/Profile'
import VehicleDetails from './pages/VehicleDetails'
import ProtectedRoute from './components/ProtectedRoute'
import { Layout } from './components/Layout/Layout'
import { Toaster } from 'sonner'

import { ThemeProvider } from './context/ThemeContext'


function App() {
  return (
    <MemoryRouter>
      <AuthProvider>
        <ThemeProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={
                <Layout>
                  <Dashboard />
                </Layout>
              } />
              <Route path="/notifications" element={
                <Layout>
                  <Notifications />
                </Layout>
              } />
              <Route path="/alerts" element={
                <Layout>
                  <Alerts />
                </Layout>
              } />
              <Route path="/vehicle/:id" element={
                <Layout>
                  <VehicleDetails />
                </Layout>
              } />
              <Route path="/profile" element={
                <Layout>
                  <Profile />
                </Layout>
              } />
            </Route>
          </Routes>
          <Toaster position="top-right" theme="light" />
        </ThemeProvider>
      </AuthProvider>
    </MemoryRouter>
  )
}

export default App
