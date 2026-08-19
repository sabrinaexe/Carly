export type VehicleType = 'car' | 'motorcycle' | 'truck' | 'trailer' | 'scooter' | 'bus';
export type Brand = {
    id: string;
    name: string;
    type: VehicleType;
    created_at: string;
};
export type Model = {
    id: string;
    brand_id: string;
    name: string;
    created_at: string;
};
export type Vehicle = {
    id: string
    created_at: string
    user_id: string
    type: VehicleType
    make: string
    model: string
    year: number
    license_plate: string | null
    vin: string | null
    color: string
    insurance_expiry?: string | null
    itp_expiry?: string | null
    rovinieta_expiry?: string | null
    trailer_type?: string | null
    weight_capacity?: number | null
    passenger_capacity?: number | null
}

export type VehicleFormData = Omit<Vehicle, 'id' | 'created_at' | 'user_id'>
export type VehicleInsert = Omit<Vehicle, 'id' | 'created_at'>
export type VehicleUpdate = Partial<VehicleFormData>

export type VehicleDocument = {
    id: string
    car_id: string // DB column is likely still car_id
    name: string
    file_path: string
    file_type: 'insurance' | 'itp' | 'rovinieta' | 'other'
    expiry_date?: string | null
    created_at: string
}

export type VehicleDocumentInsert = Omit<VehicleDocument, 'id' | 'created_at'>

export type MaintenanceLog = {
    id: string
    car_id: string // DB column is likely still car_id
    service_date: string
    description: string
    cost: number
    odometer?: number
    notes?: string
    created_at: string
}

export type MaintenanceLogInsert = Omit<MaintenanceLog, 'id' | 'created_at'>
