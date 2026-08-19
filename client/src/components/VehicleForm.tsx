import { useState, useEffect } from 'react'
import { vehicleService } from '../services/vehicleService'
import type { VehicleFormData, VehicleType, Brand, Model } from '../types/vehicle'
import { X, Car, Bike, Truck, Caravan, Zap, Bus } from 'lucide-react'

type VehicleFormProps = {
    onSubmit: (vehicle: VehicleFormData) => Promise<void>
    onCancel: () => void
    loading: boolean
    initialData?: VehicleFormData
}

const VEHICLE_TYPES: { type: VehicleType; label: string; icon: any }[] = [
    { type: 'car', label: 'Mașină', icon: Car },
    { type: 'motorcycle', label: 'Motocicletă', icon: Bike },
    { type: 'truck', label: 'Camion', icon: Truck },
    { type: 'trailer', label: 'Remorcă', icon: Caravan },
    { type: 'scooter', label: 'Scuter', icon: Zap },
    { type: 'bus', label: 'Autobuz', icon: Bus },
]

const VEHICLE_TYPE_LABELS: Record<string, string> = {
    car: 'Mașină',
    motorcycle: 'Motocicletă',
    truck: 'Camion',
    trailer: 'Remorcă',
    scooter: 'Scuter',
    bus: 'Autobuz',
}

export default function VehicleForm({ onSubmit, onCancel, loading, initialData }: VehicleFormProps) {
    const [step, setStep] = useState<1 | 2>(initialData?.type ? 2 : 1)
    const [brands, setBrands] = useState<Brand[]>([])
    const [models, setModels] = useState<Model[]>([])

    // Manual entry states
    const [isCustomBrand, setIsCustomBrand] = useState(false)
    const [isCustomModel, setIsCustomModel] = useState(false)

    // Years generation (1980 - Current + 1)
    const currentYear = new Date().getFullYear() + 1
    const years = Array.from({ length: currentYear - 1980 + 1 }, (_, i) => currentYear - i)

    const [formData, setFormData] = useState<VehicleFormData>(initialData || {
        type: 'car',
        make: '',
        model: '',
        year: new Date().getFullYear(),
        license_plate: '',
        vin: '',
        color: '',
        insurance_expiry: '',
        itp_expiry: '',
        rovinieta_expiry: '',
        trailer_type: '',
        weight_capacity: undefined,
        passenger_capacity: undefined
    })

    // Initialization with smart defaults
    useEffect(() => {
        if (initialData) {
            if (initialData.type === 'trailer' || initialData.type === 'bus') {
                setIsCustomBrand(true)
                setIsCustomModel(true)
            } else if (initialData.type === 'truck') {
                setIsCustomModel(true)
            }
        }
    }, [initialData])

    // Update custom flags when type changes
    useEffect(() => {
        if (formData.type === 'trailer' || formData.type === 'bus') {
            setIsCustomBrand(true)
            setIsCustomModel(true)
        } else if (formData.type === 'truck') {
            setIsCustomBrand(false)
            setIsCustomModel(true)
        } else {
            // Check if we should reset manual mode - strictly speaking we should, 
            // unless we want to persist user's choice to type manually.
            // But usually switching types means starting fresh.
            setIsCustomBrand(false)
            setIsCustomModel(false)
        }
    }, [formData.type])


    // Fetch brands when type changes
    useEffect(() => {
        if (formData.type && step === 2 && !isCustomBrand && formData.type !== 'trailer' && formData.type !== 'bus') {
            vehicleService.getBrands(formData.type).then(setBrands).catch(console.error)
        }
    }, [formData.type, step, isCustomBrand])

    // Fetch models when brand changes
    useEffect(() => {
        if (formData.make && !isCustomBrand && !isCustomModel && formData.type !== 'trailer' && formData.type !== 'truck' && formData.type !== 'bus') {
            const brand = brands.find(b => b.name === formData.make)
            console.log('[VehicleForm] Selected brand name:', formData.make)
            console.log('[VehicleForm] Found brand object:', brand)

            if (brand) {
                console.log('[VehicleForm] Fetching models for brand ID:', brand.id)
                vehicleService.getModels(brand.id).then(setModels).catch(console.error)
            } else {
                console.warn('[VehicleForm] Brand not found in list (or list empty)')
            }
        } else {
            setModels([])
        }
    }, [formData.make, brands, isCustomBrand, isCustomModel, formData.type])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSubmit(formData)
    }

    const handleTypeSelect = (type: VehicleType) => {
        setFormData(prev => ({ ...prev, type }))
        setStep(2)
    }

    return (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 w-full max-w-lg relative animate-in fade-in zoom-in duration-200 shadow-2xl max-h-[95vh] overflow-y-auto custom-scrollbar">
                <button
                    onClick={onCancel}
                    className="absolute top-4 right-4 p-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all"
                >
                    <X size={18} />
                </button>

                <h2 className="text-xl font-bold mb-1 text-slate-800 dark:text-white">
                    {step === 1 ? 'Selectează tipul vehiculului' : 'Detalii vehicul'}
                </h2>
                {step === 2 && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
                        Adăugare un <span className="font-bold uppercase text-slate-700 dark:text-slate-200">{VEHICLE_TYPE_LABELS[formData.type] || formData.type}</span>
                        <button onClick={() => setStep(1)} className="text-blue-500 hover:underline text-xs font-semibold">Schimbă</button>
                    </p>
                )}

                {step === 1 ? (
                    <div className="grid grid-cols-2 gap-3 mt-4">
                        {VEHICLE_TYPES.map(({ type, label, icon: Icon }) => (
                            <button
                                key={type}
                                onClick={() => handleTypeSelect(type)}
                                className="flex flex-col items-center justify-center gap-2 p-5 rounded-xl border-2 border-slate-100 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
                            >
                                <Icon size={28} className="text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                                <span className="font-bold text-sm text-slate-700 dark:text-slate-200 group-hover:text-blue-700 dark:group-hover:text-blue-400">{label}</span>
                            </button>
                        ))}
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 sm:col-span-1">
                                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Marcă</label>
                                <div className="relative">
                                    {isCustomBrand ? (
                                        <div className="relative">
                                            <input
                                                required
                                                autoFocus
                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-500 outline-none transition-all text-slate-700 dark:text-white text-sm"
                                                value={formData.make}
                                                onChange={e => setFormData({ ...formData, make: e.target.value, model: '' })}
                                                placeholder="Introduceți marca"
                                            />
                                            {formData.type !== 'trailer' && formData.type !== 'bus' && (
                                                <button
                                                    type="button"
                                                    onClick={() => { setIsCustomBrand(false); setFormData({ ...formData, make: '' }); }}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600"
                                                >
                                                    Din listă
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <select
                                                required
                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-500 outline-none transition-all text-slate-700 dark:text-white appearance-none text-sm"
                                                value={formData.make}
                                                onChange={e => {
                                                    if (e.target.value === 'OTHER') {
                                                        setIsCustomBrand(true)
                                                        setFormData({ ...formData, make: '', model: '' })
                                                    } else {
                                                        setFormData({ ...formData, make: e.target.value, model: '' })
                                                    }
                                                }}
                                            >
                                                <option value="">Selectează marca</option>
                                                <option value="OTHER" className="font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30">+ Scrie manual</option>
                                                <option disabled>──────────</option>
                                                {brands.length > 0 ? (
                                                    brands.map(brand => (
                                                        <option key={brand.id} value={brand.name}>{brand.name}</option>
                                                    ))
                                                ) : (
                                                    <option disabled>Nicio marcă găsită (Scrie manual)</option>
                                                )}
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Model</label>
                                <div className="relative">
                                    {isCustomModel ? (
                                        <div className="relative">
                                            <input
                                                required
                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-500 outline-none transition-all text-slate-700 dark:text-white text-sm"
                                                value={formData.model}
                                                onChange={e => setFormData({ ...formData, model: e.target.value })}
                                                placeholder="Introduceți modelul"
                                            />
                                            {formData.type !== 'trailer' && formData.type !== 'truck' && formData.type !== 'bus' && (
                                                <button
                                                    type="button"
                                                    onClick={() => { setIsCustomModel(false); setFormData({ ...formData, model: '' }); }}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600"
                                                >
                                                    Din listă
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <select
                                                required
                                                disabled={!formData.make}
                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-500 outline-none transition-all text-slate-700 dark:text-white disabled:opacity-50 appearance-none text-sm"
                                                value={formData.model}
                                                onChange={e => {
                                                    if (e.target.value === 'OTHER') {
                                                        setIsCustomModel(true)
                                                        setFormData({ ...formData, model: '' })
                                                    } else {
                                                        setFormData({ ...formData, model: e.target.value })
                                                    }
                                                }}
                                            >
                                                <option value="">Selectează modelul</option>
                                                <option value="OTHER" className="font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30">+ Scrie manual</option>
                                                <option disabled>──────────</option>
                                                {models.length > 0 ? (
                                                    models.map(model => (
                                                        <option key={model.id} value={model.name}>{model.name}</option>
                                                    ))
                                                ) : (
                                                    <option disabled>Niciun model găsit (Scrie manual)</option>
                                                )}
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Trailer Specific Fields */}
                        {formData.type === 'trailer' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Tip remorcă</label>
                                    <input
                                        required
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-500 outline-none transition-all text-slate-700 dark:text-white text-sm"
                                        value={formData.trailer_type || ''}
                                        onChange={e => setFormData({ ...formData, trailer_type: e.target.value })}
                                        placeholder="ex: Box, Flatbed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Capacitate (kg)</label>
                                    <input
                                        required
                                        type="number"
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-500 outline-none transition-all text-slate-700 dark:text-white text-sm"
                                        value={formData.weight_capacity || ''}
                                        onChange={e => setFormData({ ...formData, weight_capacity: parseInt(e.target.value) || undefined })}
                                        placeholder="e.g. 750"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Bus Specific Fields */}
                        {formData.type === 'bus' && (
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Capacitate pasageri</label>
                                    <input
                                        required
                                        type="number"
                                        min="1"
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-500 outline-none transition-all text-slate-700 dark:text-white text-sm"
                                        value={formData.passenger_capacity || ''}
                                        onChange={e => setFormData({ ...formData, passenger_capacity: parseInt(e.target.value) || undefined })}
                                        placeholder="e.g. 50"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">An</label>
                                <div className="relative">
                                    <select
                                        required
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-500 outline-none transition-all text-slate-700 dark:text-white appearance-none text-sm"
                                        value={formData.year}
                                        onChange={e => setFormData({ ...formData, year: parseInt(e.target.value) })}
                                    >
                                        {years.map(year => (
                                            <option key={year} value={year}>{year}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                                        ▼
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Culoare</label>
                                <input
                                    required
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-500 outline-none transition-all text-slate-700 dark:text-white text-sm"
                                    value={formData.color}
                                    onChange={e => setFormData({ ...formData, color: e.target.value })}
                                    placeholder="ex: Negru"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {formData.type !== 'scooter' && (
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Nr. de înmatriculare</label>
                                    <input
                                        required
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-500 outline-none transition-all text-slate-700 dark:text-white font-mono uppercase text-sm"
                                        value={formData.license_plate || ''}
                                        onChange={e => setFormData({ ...formData, license_plate: e.target.value.toUpperCase() })}
                                        placeholder="B 101 AAA"
                                    />
                                </div>
                            )}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">VIN</label>
                                <input
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-500 outline-none transition-all text-slate-700 dark:text-white font-mono text-sm"
                                    value={formData.vin || ''}
                                    onChange={e => setFormData({ ...formData, vin: e.target.value.toUpperCase() })}
                                    placeholder="XXXXXXXXXXXXXXXXX"
                                />
                            </div>
                        </div>

                        <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                            <h3 className="text-xs font-bold text-slate-800 dark:text-white">Date expirare</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">Asigurare</label>
                                    <input
                                        type="date"
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-2 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-500 outline-none transition-all text-slate-700 dark:text-white text-xs"
                                        value={formData.insurance_expiry || ''}
                                        onChange={e => setFormData({ ...formData, insurance_expiry: e.target.value })}
                                    />
                                </div>
                                {formData.type !== 'scooter' && (
                                    <>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">ITP</label>
                                            <input
                                                type="date"
                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-2 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-500 outline-none transition-all text-slate-700 dark:text-white text-xs"
                                                value={formData.itp_expiry || ''}
                                                onChange={e => setFormData({ ...formData, itp_expiry: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">Rovinieta</label>
                                            <input
                                                type="date"
                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-2 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-500 outline-none transition-all text-slate-700 dark:text-white text-xs"
                                                value={formData.rovinieta_expiry || ''}
                                                onChange={e => setFormData({ ...formData, rovinieta_expiry: e.target.value })}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onCancel}
                                className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
                            >
                                Anulează
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2 text-sm font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                            >
                                {loading ? 'Se salvează...' : 'Salvează vehiculul'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}
