import { supabase } from './supabase'
import type { Vehicle, VehicleInsert, VehicleUpdate, Brand, Model, VehicleType } from '../types/vehicle'

export const vehicleService = {
    async getVehicles() {
        const { data, error } = await supabase
            .from('vehicles')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) throw error
        return data as Vehicle[]
    },

    async addVehicle(vehicle: VehicleInsert) {
        const isScooter = vehicle.type === 'scooter'

        const sanitizedVehicle = {
            ...vehicle,
            insurance_expiry: vehicle.insurance_expiry || null,
            itp_expiry: isScooter ? null : (vehicle.itp_expiry || null),
            rovinieta_expiry: isScooter ? null : (vehicle.rovinieta_expiry || null),
            vin: vehicle.vin || null,
            license_plate: isScooter ? 'N/A' : (vehicle.license_plate || vehicle.license_plate),
            trailer_type: vehicle.trailer_type || null,
            weight_capacity: vehicle.weight_capacity || null,
            passenger_capacity: vehicle.passenger_capacity || null
        }

        if (sanitizedVehicle.trailer_type === null) delete (sanitizedVehicle as any).trailer_type
        if (sanitizedVehicle.weight_capacity === null) delete (sanitizedVehicle as any).weight_capacity
        if (sanitizedVehicle.passenger_capacity === null) delete (sanitizedVehicle as any).passenger_capacity

        const { data, error } = await supabase
            .from('vehicles')
            .insert([sanitizedVehicle])
            .select()
            .single()

        if (error) {
            console.error('[VehicleService] Add Vehicle Error:', JSON.stringify(error, null, 2))
            console.error('[VehicleService] Payload sent:', JSON.stringify(sanitizedVehicle, null, 2))
            throw error
        }
        return data as Vehicle
    },

    async updateVehicle(id: string, updates: VehicleUpdate) {
        const isScooter = updates.type === 'scooter'
        // Sanitize date fields and optionals if they represent empty strings
        const sanitizedUpdates = { ...updates }

        // Dates
        if (sanitizedUpdates.insurance_expiry === '') sanitizedUpdates.insurance_expiry = null
        if (sanitizedUpdates.itp_expiry === '' || isScooter) sanitizedUpdates.itp_expiry = null
        if (sanitizedUpdates.rovinieta_expiry === '' || isScooter) sanitizedUpdates.rovinieta_expiry = null

        // Strings that should be null if empty
        if (sanitizedUpdates.vin === '') sanitizedUpdates.vin = null
        if (sanitizedUpdates.trailer_type === '') sanitizedUpdates.trailer_type = null
        // Scooters don't have license plates — use 'N/A' to satisfy NOT NULL constraint
        if (isScooter) {
            sanitizedUpdates.license_plate = 'N/A'
        } else if (sanitizedUpdates.license_plate === '') {
            sanitizedUpdates.license_plate = null
        }

        // REMOVE KEYS if they are null to prevent "column does not exist" error
        if (sanitizedUpdates.trailer_type === null) delete (sanitizedUpdates as any).trailer_type
        if ((sanitizedUpdates as any).weight_capacity === null || (sanitizedUpdates as any).weight_capacity === undefined) {
            delete (sanitizedUpdates as any).weight_capacity
        }
        if ((sanitizedUpdates as any).passenger_capacity === null || (sanitizedUpdates as any).passenger_capacity === undefined) {
            delete (sanitizedUpdates as any).passenger_capacity
        }

        const { data, error } = await supabase
            .from('vehicles')
            .update(sanitizedUpdates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data as Vehicle
    },

    async deleteVehicle(id: string) {
        const { error } = await supabase
            .from('vehicles')
            .delete()
            .eq('id', id)

        if (error) throw error
    },

    // Metadata fetchers
    async getBrands(type: VehicleType) {
        console.log(`[VehicleService] Fetching brands for type: ${type}`)

        // DEBUG: Check if ANY brands exist
        const allBrands = await supabase.from('brands').select('count', { count: 'exact', head: true })
        console.log(`[VehicleService] Total brands in DB: ${allBrands.count}`)

        const { data, error } = await supabase
            .from('brands')
            .select('*')
            .eq('type', type)
            .order('name', { ascending: true })

        if (error) {
            console.error('[VehicleService] Error fetching brands:', error)
            throw error
        }
        console.log(`[VehicleService] Fetched ${data?.length || 0} brands`)
        return data as Brand[]
    },

    async getModels(brandId: string) {
        console.log(`[VehicleService] Fetching models for brand: ${brandId}`)
        const { data, error } = await supabase
            .from('models')
            .select('*')
            .eq('brand_id', brandId)
            .order('name', { ascending: true })

        if (error) {
            console.error('[VehicleService] Error fetching models:', error)
            throw error
        }
        console.log(`[VehicleService] Fetched ${data?.length || 0} models`)
        return data as Model[]
    }
}
