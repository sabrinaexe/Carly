import { supabase } from './supabase';
import type { MaintenanceLog, MaintenanceLogInsert } from '../types/vehicle';

export const maintenanceService = {
    async getLogs(vehicleId: string) {
        const { data, error } = await supabase
            .from('maintenance_logs')
            .select('*')
            .eq('car_id', vehicleId)
            .order('service_date', { ascending: false });
        if (error) throw error;
        return data as MaintenanceLog[];
    },

    async addLog(log: MaintenanceLogInsert) {
        const { data, error } = await supabase
            .from('maintenance_logs')
            .insert([log])
            .select()
            .single();
        if (error) throw error;
        return data as MaintenanceLog;
    },

    async deleteLog(id: string) {
        const { error } = await supabase
            .from('maintenance_logs')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },
};
