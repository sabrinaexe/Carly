import { useState, useEffect } from 'react'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { vehicleService } from '../services/vehicleService'
import type { Vehicle } from '../types/vehicle'
import { VehicleCard } from '../components/Dashboard/VehicleCard'

export default function Alerts() {
    const [vehicles, setVehicles] = useState<Vehicle[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadVehicles()
    }, [])

    async function loadVehicles() {
        try {
            const data = await vehicleService.getVehicles()
            setVehicles(data)
        } catch (error) {
            console.error('Error loading vehicles:', error)
        } finally {
            setLoading(false)
        }
    }

    // Helper for days left
    const getDaysLeft = (dateStr?: string | null) => {
        if (!dateStr) return 999
        const date = new Date(dateStr)
        date.setHours(0, 0, 0, 0)
        const now = new Date()
        now.setHours(0, 0, 0, 0)
        return Math.ceil((date.getTime() - now.getTime()) / 86400000)
    }

    // Filter and Sort Logic
    const problemVehicles = vehicles.filter(vehicle => {
        const daysList = [vehicle.insurance_expiry, vehicle.itp_expiry, vehicle.rovinieta_expiry].map(d => d ? getDaysLeft(d) : 999)
        // Keep only expired or urgent (<= 7 days)
        return daysList.some(d => d <= 7)
    }).sort((a, b) => {
        // Custom sort: Expired comes first, then Urgent
        // We can sort by the minimum days left for each vehicle
        const minA = Math.min(...[a.insurance_expiry, a.itp_expiry, a.rovinieta_expiry].map(d => d ? getDaysLeft(d) : 999))
        const minB = Math.min(...[b.insurance_expiry, b.itp_expiry, b.rovinieta_expiry].map(d => d ? getDaysLeft(d) : 999))
        return minA - minB
    })

    if (loading) return <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-500">Se încarcă...</div>

    return (
        <div className="flex flex-col gap-8 pb-10">
            <div className="flex items-center gap-4">
                <Link to="/" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500 dark:text-slate-400">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Alerte</h1>
                    <p className="text-slate-500 dark:text-slate-400">Vehicule care necesită atenție imediată</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {problemVehicles.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-slate-400 dark:text-slate-500">
                        <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-4">
                            <AlertCircle className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-1">Totul e OK!</h3>
                        <p>Niciun document expirat sau urgent.</p>
                    </div>
                ) : (
                    problemVehicles.map(vehicle => {
                        const daysList = [vehicle.insurance_expiry, vehicle.itp_expiry, vehicle.rovinieta_expiry].map(d => d ? getDaysLeft(d) : 999)
                        const isExpired = daysList.some(d => d < 0)
                        return (
                            <VehicleCard
                                key={vehicle.id}
                                vehicle={vehicle}
                                status={isExpired ? 'expired' : 'urgent'}
                            />
                        )
                    })
                )}
            </div>
        </div>
    )
}
