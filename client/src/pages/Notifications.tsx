import { useState, useEffect } from 'react'
import { Bell, Calendar, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react'
import { vehicleService } from '../services/vehicleService'


type NotificationItem = {
    id: string
    type: 'expired' | 'urgent' | 'upcoming'
    title: string
    message: string
    date: string
    vehicleId: string
}



// ─── Main Component ─────────────────────────────────────────────────────
export default function Notifications() {
    const [loading, setLoading] = useState(true)
    const [notifications, setNotifications] = useState<NotificationItem[]>([])

    useEffect(() => {
        loadNotifications()
    }, [])

    async function loadNotifications() {
        try {
            const vehicles = await vehicleService.getVehicles()
            const newNotifications: NotificationItem[] = []

            vehicles.forEach(vehicle => {
                const checks = [
                    { type: 'insurance', label: 'Asigurare', date: vehicle.insurance_expiry },
                    { type: 'itp', label: 'ITP', date: vehicle.itp_expiry },
                    { type: 'rovinieta', label: 'Rovinieta', date: vehicle.rovinieta_expiry }
                ]

                checks.forEach(check => {
                    if (!check.date) return

                    const daysLeft = getDaysLeft(check.date)

                    if (daysLeft < 0) {
                        newNotifications.push({
                            id: `${vehicle.id}-${check.type}-expired`,
                            type: 'expired',
                            title: `${check.label} expirată`,
                            message: `${check.label} pentru ${vehicle.make} ${vehicle.model} (${vehicle.license_plate}) a expirat pe ${new Date(check.date).toLocaleDateString('ro-RO')}.`,
                            date: check.date,
                            vehicleId: vehicle.id
                        })
                    } else if (daysLeft <= 7) {
                        newNotifications.push({
                            id: `${vehicle.id}-${check.type}-urgent`,
                            type: 'urgent',
                            title: `${check.label} expiră curând`,
                            message: `${check.label} pentru ${vehicle.make} ${vehicle.model} (${vehicle.license_plate}) expiră în ${daysLeft} zile.`,
                            date: check.date,
                            vehicleId: vehicle.id
                        })
                    } else if (daysLeft <= 30) {
                        newNotifications.push({
                            id: `${vehicle.id}-${check.type}-upcoming`,
                            type: 'upcoming',
                            title: `Expirare ${check.label} în curând`,
                            message: `${check.label} pentru ${vehicle.make} ${vehicle.model} (${vehicle.license_plate}) expiră în ${daysLeft} zile.`,
                            date: check.date,
                            vehicleId: vehicle.id
                        })
                    }
                })
            })

            // Sort by urgency (expired first, then closest dates)
            newNotifications.sort((a, b) => {
                if (a.type === 'expired' && b.type !== 'expired') return -1
                if (a.type !== 'expired' && b.type === 'expired') return 1
                return new Date(a.date).getTime() - new Date(b.date).getTime()
            })

            setNotifications(newNotifications)
        } catch (error) {
            console.error('Error loading notifications:', error)
        } finally {
            setLoading(false)
        }
    }

    const getDaysLeft = (dateStr: string) => {
        const date = new Date(dateStr)
        date.setHours(0, 0, 0, 0)
        const now = new Date()
        now.setHours(0, 0, 0, 0)
        return Math.ceil((date.getTime() - now.getTime()) / 86400000)
    }

    const getIcon = (type: NotificationItem['type']) => {
        switch (type) {
            case 'expired': return <AlertCircle className="w-6 h-6 text-red-500" />
            case 'urgent': return <AlertTriangle className="w-6 h-6 text-orange-500" />
            case 'upcoming': return <Calendar className="w-6 h-6 text-yellow-500" />
            default: return <Bell className="w-6 h-6 text-blue-500" />
        }
    }

    const getBgColor = (type: NotificationItem['type']) => {
        switch (type) {
            case 'expired': return 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900'
            case 'urgent': return 'bg-orange-50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900'
            case 'upcoming': return 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-100 dark:border-yellow-900/50'
            default: return 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'
        }
    }

    if (loading) return <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-500">Se încarcă notificările...</div>

    return (
        <div className="max-w-3xl mx-auto pb-10">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <Bell className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Notificări</h1>
                    <p className="text-slate-500 dark:text-slate-400">Fii la curent cu starea vehiculelor tale</p>
                </div>
            </div>



            {notifications.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="mx-auto w-16 h-16 bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Totul este în regulă</h3>
                    <p className="text-slate-500 dark:text-slate-400">Nu ai notificări noi.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {notifications.map(notification => (
                        <div
                            key={notification.id}
                            className={`p-6 rounded-2xl border ${getBgColor(notification.type)} flex items-start gap-4 transition-all hover:shadow-md`}
                        >
                            <div className="p-2 bg-white dark:bg-slate-950 rounded-xl shadow-sm shrink-0">
                                {getIcon(notification.type)}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="font-bold text-slate-900 dark:text-white">{notification.title}</h3>
                                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                        {new Date(notification.date).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
                                    {notification.message}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
