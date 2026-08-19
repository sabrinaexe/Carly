import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

import NotificationManager from './NotificationManager'

export default function ProtectedRoute() {
    const { session, loading } = useAuth()

    if (loading) {
        return <div className="flex h-screen items-center justify-center text-primary">Loading...</div>
    }

    if (!session) {
        return <Navigate to="/login" replace />
    }

    return (
        <>
            <NotificationManager />
            <Outlet />
        </>
    )
}
