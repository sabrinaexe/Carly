import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useState, useEffect } from 'react'
import { maintenanceService } from '../services/maintenanceService'
import type { MaintenanceLog } from '../types/vehicle'

export default function CostChart({ vehicleId }: { vehicleId: string }) {
    const [logs, setLogs] = useState<MaintenanceLog[]>([])

    useEffect(() => {
        maintenanceService.getLogs(vehicleId).then(setLogs)
    }, [vehicleId])

    const data = logs.map(log => ({
        date: new Date(log.service_date).toLocaleDateString(),
        amount: log.cost,
        description: log.description
    })).reverse()

    if (data.length === 0) return <div className="text-center text-slate-500 text-xs py-4">No data for chart</div>

    return (
        <div className="mt-4 bg-white rounded-lg p-2 border border-slate-200 h-[200px]" style={{ width: '100%', minHeight: '200px' }}>
            <ResponsiveContainer width="99%" height="100%" minWidth={0}>
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={10} />
                    <YAxis stroke="#64748b" fontSize={10} />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ color: '#64748b' }}
                        labelStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                    />
                    <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}
