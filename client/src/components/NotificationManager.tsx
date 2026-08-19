import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { vehicleService } from '../services/vehicleService'
import { useAuth } from '../context/AuthContext'

export default function NotificationManager() {
    const { user } = useAuth()
    const hasCheckedRef = useRef(false)

    useEffect(() => {
        if (!user || hasCheckedRef.current) return

        checkExpirations()
        hasCheckedRef.current = true
    }, [user])

    async function checkExpirations() {
        try {
            const vehicles = await vehicleService.getVehicles()
            let expiredCount = 0
            let urgentCount = 0
            const criticalVehicles: string[] = []

            vehicles.forEach(vehicle => {
                const checks = [
                    { type: 'Insurance', date: vehicle.insurance_expiry },
                    { type: 'ITP', date: vehicle.itp_expiry },
                    { type: 'Rovinieta', date: vehicle.rovinieta_expiry }
                ]

                let hasIssue = false
                checks.forEach(check => {
                    if (!check.date) return
                    const days = Math.ceil((new Date(check.date).getTime() - new Date().getTime()) / 86400000)

                    if (days < 0) {
                        expiredCount++
                        hasIssue = true
                    } else if (days <= 7) {
                        urgentCount++
                        hasIssue = true
                    }
                })

                if (hasIssue) {
                    criticalVehicles.push(`${vehicle.make} ${vehicle.model} (${vehicle.license_plate})`)
                }
            })

            if (expiredCount > 0) {
                const title = expiredCount === 1 ? "Document expirat!" : "Documente expirate!"
                const body = expiredCount === 1 
                  ? "Un document a expirat."
                  : `${expiredCount} documente au expirat.`

                toast.error(title, {
                    description: body,
                    duration: Infinity,
                    action: {
                        label: 'Ignoră',
                        onClick: () => { }
                    }
                })
                sendNativeNotification(title, body)
            } else if (urgentCount > 0) {
                const title = urgentCount === 1 ? "Document expiră curând" : "Documente expiră curând"
                const body = urgentCount === 1 
                  ? "Un document expiră în următoarele 7 zile."
                  : `${urgentCount} documente expiră în următoarele 7 zile.`

                toast.warning(title, {
                    description: body,
                    duration: 8000,
                    action: {
                        label: 'Ignoră',
                        onClick: () => { }
                    }
                })
                sendNativeNotification(title, body)
            }



        } catch (error) {
            console.error('Failed to check notifications:', error)
        }
    }



    function sendNativeNotification(title: string, body: string) {
        if (!('Notification' in window)) return

        if (Notification.permission === 'granted') {
            new Notification(title, { body, icon: '/logo.svg' })
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification(title, { body, icon: '/logo.svg' })
                }
            })
        }
    }

    return null
}
