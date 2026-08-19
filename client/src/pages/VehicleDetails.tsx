import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { vehicleService } from '../services/vehicleService'
import { documentService } from '../services/documentService'
import type { Vehicle, VehicleFormData, VehicleDocument } from '../types/vehicle'
import { ArrowLeft, Save, Trash2, AlertCircle, AlertTriangle, Calendar, CheckCircle2, Wrench, Upload, FileText, Eye, X } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import MaintenanceLogs from '../components/MaintenanceLogs'

const VEHICLE_TYPE_LABELS: Record<string, string> = {
    car: 'Mașină',
    motorcycle: 'Motocicletă',
    truck: 'Camion',
    trailer: 'Remorcă',
    scooter: 'Scuter',
    bus: 'Autobuz',
}

export default function VehicleDetails() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [vehicle, setVehicle] = useState<Vehicle | null>(null)
    const [showMaintenance, setShowMaintenance] = useState(false)

    // Document upload state
    const [docs, setDocs] = useState<VehicleDocument[]>([])
    const [uploading, setUploading] = useState<string | null>(null) // tracks which type is uploading

    // Form State
    const [formData, setFormData] = useState<VehicleFormData>({
        type: 'car',
        make: '',
        model: '',
        year: new Date().getFullYear(),
        license_plate: '',
        vin: '',
        color: '',
        insurance_expiry: '',
        itp_expiry: '',
        rovinieta_expiry: ''
    })

    useEffect(() => {
        if (id) {
            loadVehicle(id)
            loadDocs(id)
        }
    }, [id])

    async function loadVehicle(vehicleId: string) {
        try {
            const vehicles = await vehicleService.getVehicles()
            const found = vehicles.find(c => c.id === vehicleId)
            if (found) {
                setVehicle(found)
                setFormData({
                    type: found.type,
                    make: found.make,
                    model: found.model,
                    year: found.year,
                    license_plate: found.license_plate,
                    vin: found.vin,
                    color: found.color,
                    insurance_expiry: found.insurance_expiry || '',
                    itp_expiry: found.itp_expiry || '',
                    rovinieta_expiry: found.rovinieta_expiry || '',
                    passenger_capacity: found.passenger_capacity
                })
            } else {
                toast.error('Vehiculul nu a fost găsit')
                navigate('/')
            }
        } catch (error) {
            console.error('Error loading vehicle:', error)
            toast.error('Nu s-au putut încărca detaliile vehiculului')
        } finally {
            setLoading(false)
        }
    }

    async function loadDocs(vehicleId: string) {
        try {
            const data = await documentService.getDocuments(vehicleId)
            setDocs(data)
        } catch (error) {
            console.error('Error loading docs:', error)
        }
    }

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>, type: VehicleDocument['file_type']) {
        if (!e.target.files || e.target.files.length === 0 || !id) return
        const file = e.target.files[0]
        setUploading(type)
        try {
            await documentService.uploadDocument(id, file, type)
            await loadDocs(id)
            toast.success(`Document ${type} încărcat`)
        } catch (error) {
            console.error('Error uploading:', error)
            toast.error('Încărcarea a eșuat')
        } finally {
            setUploading(null)
            // Reset the input so the same file can be re-selected
            e.target.value = ''
        }
    }

    async function handleViewDoc(path: string) {
        try {
            const url = await documentService.getDownloadUrl(path)
            window.open(url, '_blank')
        } catch (error) {
            console.error('Error getting URL:', error)
            toast.error('Nu s-a putut deschide documentul')
        }
    }

    async function handleDeleteDoc(docId: string, path: string) {
        if (!confirm('Șterge acest document?')) return
        try {
            await documentService.deleteDocument(docId, path)
            setDocs(docs.filter(d => d.id !== docId))
            toast.success('Document șters')
        } catch (error) {
            console.error('Error deleting:', error)
            toast.error('Nu s-a putut șterge documentul')
        }
    }

    async function handleSave() {
        if (!user || !vehicle) return
        setSaving(true)
        try {
            await vehicleService.updateVehicle(vehicle.id, formData)
            toast.success('Vehicul actualizat cu succes')
            navigate('/')
        } catch (error) {
            console.error('Error updating vehicle:', error)
            toast.error('Nu s-a putut actualiza vehiculul')
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete() {
        if (!vehicle || !window.confirm('Ești sigur că vrei să ștergi acest vehicul?')) return
        try {
            await vehicleService.deleteVehicle(vehicle.id)
            toast.success('Vehicul șters')
            navigate('/')
        } catch (error) {
            console.error('Error deleting vehicle:', error)
            toast.error('Nu s-a putut șterge vehiculul')
        }
    }

    // Issue identification logic
    const getIssues = () => {
        const issues: { type: string, days: number, severity: 'expired' | 'urgent' | 'soon' | 'ok', date: string }[] = []

        const checkDate = (dateStr: string | null | undefined, type: string) => {
            if (!dateStr) return
            const date = new Date(dateStr)
            date.setHours(0, 0, 0, 0)
            const now = new Date()
            now.setHours(0, 0, 0, 0)
            const days = Math.ceil((date.getTime() - now.getTime()) / 86400000)

            if (days < 0) {
                issues.push({ type, days, severity: 'expired', date: dateStr })
            } else if (days <= 7) {
                issues.push({ type, days, severity: 'urgent', date: dateStr })
            } else if (days <= 30) {
                issues.push({ type, days, severity: 'soon', date: dateStr })
            } else {
                issues.push({ type, days, severity: 'ok', date: dateStr })
            }
        }

        checkDate(formData.insurance_expiry, 'Asigurare')
        if (formData.type !== 'scooter') {
            checkDate(formData.itp_expiry, 'ITP')
            checkDate(formData.rovinieta_expiry, 'Rovinieta')
        }

        return issues.sort((a, b) => a.days - b.days)
    }

    // Helper: get docs for a specific type
    const getDocsForType = (type: string) => docs.filter(d => d.file_type === type)

    const issues = getIssues()

    if (loading) return <div className="flex justify-center items-center h-full text-slate-400 dark:text-slate-500">Se încarcă...</div>

    // Document expiry row component
    const DocumentExpiryRow = ({ label, type, dateValue, onDateChange }: {
        label: string
        type: VehicleDocument['file_type']
        dateValue: string
        onDateChange: (val: string) => void
    }) => {
        const typeDocs = getDocsForType(type)
        const fileInputRef = useRef<HTMLInputElement>(null)

        return (
            <div className="space-y-3">
                <div className="flex items-center gap-3">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{label}</label>
                        <input
                            type="date"
                            value={dateValue ? new Date(dateValue).toISOString().split('T')[0] : ''}
                            onChange={e => onDateChange(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-500 outline-none transition-all text-slate-900 dark:text-white"
                        />
                    </div>
                    <div className="pt-7">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading === type}
                            className="flex items-center gap-2 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-xl font-medium text-sm transition-colors disabled:opacity-50 whitespace-nowrap"
                        >
                            <Upload className="w-4 h-4" />
                            {uploading === type ? 'Se încarcă...' : 'Încărcare'}
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={e => handleUpload(e, type)}
                        />
                    </div>
                </div>

                {/* Uploaded documents list */}
                {typeDocs.length > 0 && (
                    <div className="space-y-2 pl-1">
                        {typeDocs.map(doc => (
                            <div key={doc.id} className="flex items-center gap-3 p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg group">
                                <FileText className="w-4 h-4 text-blue-500 dark:text-blue-400 shrink-0" />
                                <span className="text-sm text-slate-700 dark:text-slate-300 truncate flex-1" title={doc.name}>
                                    {doc.name}
                                </span>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">
                                    {new Date(doc.created_at).toLocaleDateString()}
                                </span>
                                <button
                                    onClick={() => handleViewDoc(doc.file_path)}
                                    className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                    title="View"
                                >
                                    <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={() => handleDeleteDoc(doc.id, doc.file_path)}
                                    className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                    title="Delete"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto pb-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500 dark:text-slate-400">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{formData.make} {formData.model}</h1>
                        <p className="text-slate-500 dark:text-slate-400 font-mono">{formData.license_plate === 'N/A' ? formData.type?.toUpperCase() : formData.license_plate}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowMaintenance(true)}
                        className="text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                        <Wrench className="w-5 h-5" />
                        Service
                    </button>
                    <button
                        onClick={handleDelete}
                        className="text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                        <Trash2 className="w-5 h-5" />
                        Șterge
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Form Column */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Detalii vehicul</h2>
                            <span className="text-xs font-bold px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase">{VEHICLE_TYPE_LABELS[formData.type] || formData.type}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Marcă</label>
                                <input
                                    type="text"
                                    value={formData.make}
                                    onChange={e => setFormData({ ...formData, make: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-500 outline-none transition-all text-slate-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Model</label>
                                <input
                                    type="text"
                                    value={formData.model}
                                    onChange={e => setFormData({ ...formData, model: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-500 outline-none transition-all text-slate-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">An</label>
                                <input
                                    type="number"
                                    value={formData.year}
                                    onChange={e => setFormData({ ...formData, year: parseInt(e.target.value) })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-500 outline-none transition-all text-slate-900 dark:text-white"
                                />
                            </div>
                            {formData.type !== 'scooter' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nr. de înmatriculare</label>
                                    <input
                                        type="text"
                                        value={formData.license_plate || ''}
                                        onChange={e => setFormData({ ...formData, license_plate: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-500 outline-none transition-all text-slate-900 dark:text-white font-mono uppercase"
                                    />
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">VIN</label>
                                <input
                                    type="text"
                                    value={formData.vin || ''}
                                    onChange={e => setFormData({ ...formData, vin: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-500 outline-none transition-all text-slate-900 dark:text-white font-mono"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Culoare</label>
                                <input
                                    type="text"
                                    value={formData.color}
                                    onChange={e => setFormData({ ...formData, color: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-500 outline-none transition-all text-slate-900 dark:text-white"
                                />
                            </div>
                            {formData.type === 'bus' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Capacitate pasageri</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.passenger_capacity || ''}
                                        onChange={e => setFormData({ ...formData, passenger_capacity: parseInt(e.target.value) || undefined })}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-500 outline-none transition-all text-slate-900 dark:text-white"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Expirări documente</h2>
                        <div className="grid grid-cols-1 gap-6">
                            <DocumentExpiryRow
                                label="Expirare asigurare"
                                type="insurance"
                                dateValue={formData.insurance_expiry || ''}
                                onDateChange={val => setFormData({ ...formData, insurance_expiry: val })}
                            />
                            {formData.type !== 'scooter' && (
                                <>
                                    <DocumentExpiryRow
                                        label="Expirare ITP"
                                        type="itp"
                                        dateValue={formData.itp_expiry || ''}
                                        onDateChange={val => setFormData({ ...formData, itp_expiry: val })}
                                    />
                                    <DocumentExpiryRow
                                        label="Expirare Rovinieta"
                                        type="rovinieta"
                                        dateValue={formData.rovinieta_expiry || ''}
                                        onDateChange={val => setFormData({ ...formData, rovinieta_expiry: val })}
                                    />
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {saving ? 'Se salvează...' : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Salvează modificările
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Info / Status Column */}
                <div className="space-y-6">
                    {/* Specific Issues List */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <h3 className="font-bold text-slate-900 dark:text-white mb-4">Starea vehiculului</h3>
                        <div className="space-y-3">
                            {issues.length === 0 ? (
                                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center gap-3 text-green-700 dark:text-green-400">
                                    <CheckCircle2 className="w-5 h-5" />
                                    <span className="font-medium">Toate documentele valide</span>
                                </div>
                            ) : (
                                issues.map((issue, i) => (
                                    <div key={i} className={`p-4 rounded-xl flex items-start gap-3 ${issue.severity === 'expired' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' :
                                        issue.severity === 'urgent' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400' :
                                            issue.severity === 'soon' ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400' :
                                                'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                        }`}>
                                        {issue.severity === 'expired' ? <AlertCircle className="w-5 h-5 shrink-0" /> :
                                            issue.severity === 'urgent' ? <AlertTriangle className="w-5 h-5 shrink-0" /> :
                                                issue.severity === 'soon' ? <Calendar className="w-5 h-5 shrink-0" /> :
                                                    <CheckCircle2 className="w-5 h-5 shrink-0" />}

                                        <div>
                                            <div className="font-bold text-sm">{issue.type}</div>
                                            <div className="text-xs mt-0.5 opacity-90">
                                                {issue.severity === 'expired' ? `Expirat acum ${Math.abs(issue.days)} zile` :
                                                    issue.severity === 'ok' ? `Valid` :
                                                        `Expiră în ${issue.days} zile`}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl border border-blue-100 dark:border-blue-800">
                        <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-2">Sfaturi rapide</h3>
                        <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                            Păstrează-ți documentele la zi pentru a evita amenzile. Poți încărca copii digitale în secțiunea Documente.
                        </p>
                    </div>
                </div>
            </div>

            {showMaintenance && vehicle && (
                <MaintenanceLogs
                    vehicleId={vehicle.id}
                    onClose={() => setShowMaintenance(false)}
                />
            )}
        </div>
    )
}
