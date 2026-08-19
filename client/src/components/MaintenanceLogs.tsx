import { useState, useEffect } from 'react'
import { X, Wrench, Plus, Trash2 } from 'lucide-react'
import { maintenanceService } from '../services/maintenanceService'
import type { MaintenanceLog } from '../types/vehicle'
import CostChart from './CostChart'

type MaintenanceProps = {
    vehicleId: string
    onClose: () => void
}

export default function MaintenanceLogs({ vehicleId, onClose }: MaintenanceProps) {
    const [logs, setLogs] = useState<MaintenanceLog[]>([])
    const [loading, setLoading] = useState(true)
    const [showAdd, setShowAdd] = useState(false)
    const [formData, setFormData] = useState({
        service_date: new Date().toISOString().split('T')[0],
        description: '',
        cost: '',
        odometer: '',
        notes: ''
    })

    useEffect(() => {
        loadLogs()
    }, [vehicleId])

    async function loadLogs() {
        try {
            const data = await maintenanceService.getLogs(vehicleId)
            setLogs(data)
        } catch (error) {
            console.error('Error loading logs:', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        try {
            await maintenanceService.addLog({
                car_id: vehicleId, // DB column is car_id
                service_date: formData.service_date,
                description: formData.description,
                cost: parseFloat(formData.cost) || 0,
                odometer: formData.odometer ? parseInt(formData.odometer) : undefined,
                notes: formData.notes
            })
            await loadLogs()
            setShowAdd(false)
            setFormData({
                service_date: new Date().toISOString().split('T')[0],
                description: '',
                cost: '',
                odometer: '',
                notes: ''
            })
        } catch (error) {
            console.error('Error adding log:', error)
            alert('Nu s-a putut adăuga înregistrarea')
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Șterge această înregistrare de service?')) return
        try {
            await maintenanceService.deleteLog(id)
            setLogs(logs.filter(l => l.id !== id))
        } catch (error) {
            console.error('Error deleting log:', error)
        }
    }

    const totalCost = logs.reduce((sum, log) => sum + log.cost, 0)

    return (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] w-full max-w-2xl relative h-[85vh] flex flex-col animate-zoom-in border border-white/50 dark:border-slate-800 ring-1 ring-slate-900/5">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all shadow-sm hover:shadow-md border border-slate-100 dark:border-slate-700"
                >
                    <X size={20} strokeWidth={2.5} />
                </button>

                <h2 className="text-xl font-bold mb-2 flex items-center gap-2 text-slate-800 dark:text-white">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                        <Wrench size={20} />
                    </div>
                    Istoric service
                </h2>
                <div className="text-sm text-slate-500 dark:text-slate-400 mb-6 pl-1">
                    Total cheltuit: <span className="text-slate-900 dark:text-white font-bold text-lg ml-1">${totalCost.toLocaleString()}</span>
                    <CostChart vehicleId={vehicleId} />
                </div>

                {showAdd ? (
                    <form onSubmit={handleSubmit} className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-4 mb-4 shadow-inner">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Data</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-500 outline-none transition-all text-slate-700 dark:text-white"
                                    value={formData.service_date}
                                    onChange={e => setFormData({ ...formData, service_date: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Cost (RON)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-500 outline-none transition-all text-slate-700 dark:text-white font-mono"
                                    value={formData.cost}
                                    onChange={e => setFormData({ ...formData, cost: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Descriere</label>
                            <input
                                required
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-500 outline-none transition-all text-slate-700 dark:text-white placeholder:text-slate-400"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder="ex: Schimb ulei, Rotație anvelope"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Odometru (km)</label>
                                <input
                                    type="number"
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-500 outline-none transition-all text-slate-700 dark:text-white"
                                    value={formData.odometer}
                                    onChange={e => setFormData({ ...formData, odometer: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Note</label>
                                <input
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-500 outline-none transition-all text-slate-700 dark:text-white"
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowAdd(false)}
                                className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
                            >
                                Anulează
                            </button>
                            <button
                                type="submit"
                                className="px-5 py-2 text-sm font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all active:scale-95"
                            >
                                Salvează înregistrarea
                            </button>
                        </div>
                    </form>
                ) : (
                    <button
                        onClick={() => setShowAdd(true)}
                        className="flex items-center gap-2 mb-6 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2 rounded-lg w-fit transition-colors -ml-2"
                    >
                        <Plus size={18} />
                        Adaugă înregistrare nouă
                    </button>
                )}

                <div className="flex-1 overflow-auto space-y-3 pr-2 scrollbar-thin">
                    {loading ? (
                        <div className="text-center text-slate-400 py-10">Se încarcă istoricul...</div>
                    ) : logs.length === 0 && !showAdd ? (
                        <div className="text-center text-slate-500 dark:text-slate-400 py-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                            Niciun istoric de service înregistrat.
                        </div>
                    ) : (
                        logs.map(log => (
                            <div key={log.id} className="p-5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl group hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-md transition-all shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg">{log.description}</h3>
                                    <span className="font-mono text-blue-700 dark:text-blue-300 font-bold bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-lg border border-blue-100 dark:border-blue-800">${log.cost}</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-3 font-medium">
                                    <span className="bg-slate-50 dark:bg-slate-900/50 px-2 py-1 rounded-md border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400">{new Date(log.service_date).toLocaleDateString()}</span>
                                    {log.odometer && (
                                        <>
                                            <span className="text-slate-300 dark:text-slate-600">•</span>
                                            <span className="text-slate-600 dark:text-slate-400">{log.odometer.toLocaleString()} km</span>
                                        </>
                                    )}
                                </div>
                                {log.notes && (
                                    <p className="text-sm text-slate-600 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700">"{log.notes}"</p>
                                )}
                                <div className="flex justify-end mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleDelete(log.id)}
                                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                                        title="Delete Log"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
