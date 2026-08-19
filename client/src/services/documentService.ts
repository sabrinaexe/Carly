import { supabase } from './supabase'
import type { VehicleDocument, VehicleDocumentInsert } from '../types/vehicle'

const BUCKET_NAME = 'car-docs'

export const documentService = {
    async uploadDocument(vehicleId: string, file: File, type: VehicleDocument['file_type']) {
        // 1. Upload to Storage
        const fileExt = file.name.split('.').pop()
        const fileName = `${vehicleId}/${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(fileName, file)

        if (uploadError) throw uploadError

        // 2. Insert record into database
        const doc: VehicleDocumentInsert = {
            car_id: vehicleId, // DB column is still car_id
            name: file.name,
            file_path: fileName,
            file_type: type
        }

        const { data, error: dbError } = await supabase
            .from('car_documents')
            .insert([doc])
            .select()
            .single()

        if (dbError) throw dbError
        return data as VehicleDocument
    },

    async getDocuments(vehicleId: string) {
        const { data, error } = await supabase
            .from('car_documents')
            .select('*')
            .eq('car_id', vehicleId)
            .order('created_at', { ascending: false })

        if (error) throw error
        return data as VehicleDocument[]
    },

    async getDownloadUrl(path: string) {
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .createSignedUrl(path, 60 * 60) // 1 hour expiry

        if (error) throw error
        return data.signedUrl
    },

    async deleteDocument(id: string, path: string) {
        // 1. Delete from Storage
        const { error: storageError } = await supabase.storage
            .from(BUCKET_NAME)
            .remove([path])

        if (storageError) throw storageError

        // 2. Delete from Database
        const { error: dbError } = await supabase
            .from('car_documents')
            .delete()
            .eq('id', id)

        if (dbError) throw dbError
    }
}
