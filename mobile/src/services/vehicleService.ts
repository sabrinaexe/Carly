import { supabase } from './supabase';
import type { Vehicle, VehicleInsert, VehicleUpdate, Brand, Model, VehicleType } from '../types/vehicle';

export const vehicleService = {
    async getVehicles() {
        const { data, error } = await supabase
            .from('vehicles')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data as Vehicle[];
    },

    async addVehicle(vehicle: VehicleInsert) {
        const isScooter = vehicle.type === 'scooter';
        const sanitizedVehicle: any = {
            ...vehicle,
            insurance_expiry: vehicle.insurance_expiry || null,
            itp_expiry: isScooter ? null : (vehicle.itp_expiry || null),
            rovinieta_expiry: isScooter ? null : (vehicle.rovinieta_expiry || null),
            vin: vehicle.vin || null,
            license_plate: isScooter ? 'N/A' : (vehicle.license_plate || vehicle.license_plate),
            trailer_type: vehicle.trailer_type || null,
            weight_capacity: vehicle.weight_capacity || null,
            passenger_capacity: vehicle.passenger_capacity || null,
        };

        if (sanitizedVehicle.trailer_type === null) delete sanitizedVehicle.trailer_type;
        if (sanitizedVehicle.weight_capacity === null) delete sanitizedVehicle.weight_capacity;
        if (sanitizedVehicle.passenger_capacity === null) delete sanitizedVehicle.passenger_capacity;

        const { data, error } = await supabase
            .from('vehicles')
            .insert([sanitizedVehicle])
            .select()
            .single();

        if (error) throw error;
        return data as Vehicle;
    },

    async updateVehicle(id: string, updates: VehicleUpdate) {
        const isScooter = updates.type === 'scooter';
        const sanitizedUpdates: any = { ...updates };

        if (sanitizedUpdates.insurance_expiry === '') sanitizedUpdates.insurance_expiry = null;
        if (sanitizedUpdates.itp_expiry === '' || isScooter) sanitizedUpdates.itp_expiry = null;
        if (sanitizedUpdates.rovinieta_expiry === '' || isScooter) sanitizedUpdates.rovinieta_expiry = null;
        if (sanitizedUpdates.vin === '') sanitizedUpdates.vin = null;
        if (sanitizedUpdates.trailer_type === '') sanitizedUpdates.trailer_type = null;
        if (isScooter) {
            sanitizedUpdates.license_plate = 'N/A';
        } else if (sanitizedUpdates.license_plate === '') {
            sanitizedUpdates.license_plate = null;
        }

        if (sanitizedUpdates.trailer_type === null) delete sanitizedUpdates.trailer_type;
        if (sanitizedUpdates.weight_capacity === null || sanitizedUpdates.weight_capacity === undefined) {
            delete sanitizedUpdates.weight_capacity;
        }
        if (sanitizedUpdates.passenger_capacity === null || sanitizedUpdates.passenger_capacity === undefined) {
            delete sanitizedUpdates.passenger_capacity;
        }

        const { data, error } = await supabase
            .from('vehicles')
            .update(sanitizedUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Vehicle;
    },

    async deleteVehicle(id: string) {
        const { error } = await supabase.from('vehicles').delete().eq('id', id);
        if (error) throw error;
    },

    async getBrands(type: VehicleType) {
        const { data, error } = await supabase
            .from('brands')
            .select('*')
            .eq('type', type)
            .order('name', { ascending: true });
        if (error) throw error;
        return data as Brand[];
    },

    async getModels(brandId: string) {
        const { data, error } = await supabase
            .from('models')
            .select('*')
            .eq('brand_id', brandId)
            .order('name', { ascending: true });
        if (error) throw error;
        return data as Model[];
    },
};
