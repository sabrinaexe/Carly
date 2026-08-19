import { useState, useEffect } from 'react'
import { Plus, Search, CarFront, AlertTriangle, Timer, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { vehicleService } from '../services/vehicleService'
import type { Vehicle, VehicleFormData } from '../types/vehicle'
import { AlertBanner } from "../components/Dashboard/AlertBanner"
import { StatsCard } from "../components/Dashboard/StatsCard"
import { VehicleCard } from "../components/Dashboard/VehicleCard"
import VehicleForm from '../components/VehicleForm'
import DocumentManager from '../components/DocumentManager'
import MaintenanceLogs from '../components/MaintenanceLogs'
import { toast } from 'sonner'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function Dashboard() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [vehicles, setVehicles] = useState<Vehicle[]>([])
    const [loading, setLoading] = useState(true)
    const [showAddForm, setShowAddForm] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [searchParams, setSearchParams] = useSearchParams()

    // Modal states
    const [selectedVehicleForDocs, setSelectedVehicleForDocs] = useState<string | null>(null)
    const [selectedVehicleForEdit, setSelectedVehicleForEdit] = useState<Vehicle | null>(null)
    const [selectedVehicleForMaintenance, setSelectedVehicleForMaintenance] = useState<string | null>(null)

    useEffect(() => {
        loadVehicles()
    }, [])

    // Check URL for add vehicle action
    useEffect(() => {
        if (searchParams.get('add') === 'true') {
            setShowAddForm(true)
        }
    }, [searchParams])

    const closeAddForm = () => {
        setShowAddForm(false)
        setSearchParams(params => {
            params.delete('add')
            return params
        })
    }

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

    async function handleAddVehicle(vehicleData: VehicleFormData) {
        if (!user) return
        setSubmitting(true)
        try {
            await vehicleService.addVehicle({ ...vehicleData, user_id: user.id })
            await loadVehicles()
            closeAddForm()
            toast.success('Vehicul adăugat cu succes')
        } catch (error: any) {
            console.error('Error adding vehicle:', error)
            toast.error('Nu s-a putut adăuga vehiculul: ' + (error.message || 'Eroare necunoscută'))
        } finally {
            setSubmitting(false)
        }
    }

    async function handleUpdateVehicle(vehicleData: VehicleFormData) {
        if (!selectedVehicleForEdit) return
        setSubmitting(true)
        try {
            await vehicleService.updateVehicle(selectedVehicleForEdit.id, vehicleData)
            await loadVehicles()
            setSelectedVehicleForEdit(null)
            toast.success('Vehicul actualizat cu succes')
        } catch (error: any) {
            console.error('Error adding vehicle:', error)
            toast.error('Nu s-a putut actualiza vehiculul: ' + (error.message || 'Eroare necunoscută'))
        } finally {
            setSubmitting(false)
        }
    }

    // Filter state
    const [filterStatus, setFilterStatus] = useState<'all' | 'expired' | 'urgent' | 'soon'>('all')

    // Helper for days left
    const getDaysLeft = (dateStr?: string | null) => {
        if (!dateStr) return 999
        const date = new Date(dateStr)
        date.setHours(0, 0, 0, 0)
        const now = new Date()
        now.setHours(0, 0, 0, 0)
        return Math.ceil((date.getTime() - now.getTime()) / 86400000)
    }

    // Filter Logic
    const filteredVehicles = vehicles.filter(vehicle => {
        const search = searchTerm.toLowerCase()
        const matchesSearch = (
            (vehicle.make || '').toLowerCase().includes(search) ||
            (vehicle.model || '').toLowerCase().includes(search) ||
            (vehicle.license_plate || '').toLowerCase().includes(search)
        )

        if (!matchesSearch) return false

        // Status Filter
        if (filterStatus === 'all') return true

        const daysList = [vehicle.insurance_expiry, vehicle.itp_expiry, vehicle.rovinieta_expiry].map(d => d ? getDaysLeft(d) : 999)

        if (filterStatus === 'expired') {
            return daysList.some(d => d < 0)
        }
        if (filterStatus === 'urgent') {
            return daysList.some(d => d >= 0 && d <= 7)
        }
        if (filterStatus === 'soon') {
            return daysList.some(d => d > 7 && d <= 30)
        }
        return true
    })

    // Stats Logic
    const totalVehicles = vehicles.length
    const expiredCount = vehicles.filter(c => {
        const checks = [c.insurance_expiry, c.itp_expiry, c.rovinieta_expiry]
        return checks.some(d => d && getDaysLeft(d) < 0)
    }).length

    const urgentCount = vehicles.filter(c => {
        const checks = [c.insurance_expiry, c.itp_expiry, c.rovinieta_expiry]
        return checks.some(d => {
            const days = getDaysLeft(d)
            return days >= 0 && days <= 7
        })
    }).length

    const soonCount = vehicles.filter(c => {
        const checks = [c.insurance_expiry, c.itp_expiry, c.rovinieta_expiry]
        return checks.some(d => {
            const days = getDaysLeft(d)
            return days > 7 && days <= 30
        })
    }).length

    const stats = [
        { label: "Total vehicule", value: totalVehicles, icon: CarFront, variant: "blue" as const, filter: 'all' as const },
        { label: "Expirat", value: expiredCount, icon: AlertCircle, variant: "red" as const, filter: 'expired' as const },
        { label: "Urgent (< 7 zile)", value: urgentCount, icon: AlertTriangle, variant: "orange" as const, filter: 'urgent' as const },
        { label: "Curând (< 30 zile)", value: soonCount, icon: Timer, variant: "yellow" as const, filter: 'soon' as const },
    ];

    if (loading) return <div className="flex items-center justify-center h-full text-slate-400">Se încarcă...</div>

    return (
        <div className="flex flex-col gap-8 pb-10">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Garajul meu</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 sm:mt-2 text-sm sm:text-lg">Gestionează vehiculele și urmărește datele importante</p>
                </div>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-200/50 dark:shadow-blue-900/10 transition-all active:scale-95 cursor-pointer self-start sm:self-auto"
                >
                    <Plus className="w-5 h-5" />
                    <span className="hidden xs:inline">Adaugă vehicul nou</span>
                    <span className="xs:hidden">Adaugă</span>
                </button>
            </div>

            {/* Alert Banner */}
            {(expiredCount > 0 || urgentCount > 0) && (
                <AlertBanner
                    title="Atenție urgentă necesară"
                    message={(expiredCount + urgentCount) === 1 
                        ? 'Un vehicul are documente care expiră curând sau au expirat.' 
                        : `${expiredCount + urgentCount} vehicule au documente care expiră curând sau au expirat.`}
                    onClick={() => navigate('/alerts')}
                />
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                {stats.map((stat) => (
                    <StatsCard
                        key={stat.label}
                        {...stat}
                        onClick={() => setFilterStatus(stat.filter)}
                        active={filterStatus === stat.filter}
                    />
                ))}
            </div>

            {/* Search & Filter Indicator */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Filtrează după număr, marcă sau model..."
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-500 outline-none transition-all text-slate-900 dark:text-white"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                {filterStatus !== 'all' && (
                    <button
                        onClick={() => setFilterStatus('all')}
                        className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-4 py-2 rounded-lg transition-colors"
                    >
                        Şterge filtrul "{filterStatus}"
                    </button>
                )}
            </div>

            {/* Vehicle List */}
            {filteredVehicles.length === 0 ? (
                <div className="text-center py-20 text-slate-400 dark:text-slate-500">
                    Niciun vehicul găsit {filterStatus !== 'all' ? `pentru "${filterStatus}"` : ''}.
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-8">
                    {filteredVehicles.map(vehicle => {
                        const daysList = [vehicle.insurance_expiry, vehicle.itp_expiry, vehicle.rovinieta_expiry].map(d => d ? getDaysLeft(d) : 999)
                        let status: 'expired' | 'urgent' | 'soon' | 'ok' | undefined = undefined;

                        if (daysList.some(d => d < 0)) status = 'expired'
                        else if (daysList.some(d => d <= 7)) status = 'urgent'
                        else if (daysList.some(d => d <= 30)) status = 'soon'

                        return (
                            <VehicleCard key={vehicle.id} vehicle={vehicle} status={status} />
                        );
                    })}
                </div>
            )}

            {/* Modals */}
            {showAddForm && (
                <VehicleForm
                    onSubmit={handleAddVehicle}
                    onCancel={closeAddForm}
                    loading={submitting}
                />
            )}

            {selectedVehicleForEdit && (
                <VehicleForm
                    initialData={selectedVehicleForEdit}
                    onSubmit={handleUpdateVehicle}
                    onCancel={() => setSelectedVehicleForEdit(null)}
                    loading={submitting}
                />
            )}

            {selectedVehicleForDocs && (
                <DocumentManager
                    vehicleId={selectedVehicleForDocs}
                    onClose={() => setSelectedVehicleForDocs(null)}
                />
            )}

            {selectedVehicleForMaintenance && (
                <MaintenanceLogs
                    vehicleId={selectedVehicleForMaintenance}
                    onClose={() => setSelectedVehicleForMaintenance(null)}
                />
            )}

        </div>
    );
}
