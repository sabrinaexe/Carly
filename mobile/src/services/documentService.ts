import { supabase } from './supabase';
import type { VehicleDocument, VehicleDocumentInsert } from '../types/vehicle';

const BUCKET_NAME = 'car-docs';

export const documentService = {
    async uploadDocument(
        vehicleId: string,
        fileUri: string,
        fileName: string,
        fileType: VehicleDocument['file_type']
    ) {
        const ext = fileName.split('.').pop() || 'pdf';
        const storagePath = `${vehicleId}/${Date.now()}.${ext}`;

        // Read file and upload
        const response = await fetch(fileUri);
        const blob = await response.blob();

        const { error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(storagePath, blob, {
                contentType: blob.type || 'application/octet-stream',
            });

        if (uploadError) throw uploadError;

        const doc: VehicleDocumentInsert = {
            car_id: vehicleId,
            name: fileName,
            file_path: storagePath,
            file_type: fileType,
        };

        const { data, error: dbError } = await supabase
            .from('car_documents')
            .insert([doc])
            .select()
            .single();

        if (dbError) throw dbError;
        return data as VehicleDocument;
    },

    async getDocuments(vehicleId: string) {
        const { data, error } = await supabase
            .from('car_documents')
            .select('*')
            .eq('car_id', vehicleId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data as VehicleDocument[];
    },

    async getDownloadUrl(path: string) {
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .createSignedUrl(path, 60 * 60);
        if (error) throw error;
        return data.signedUrl;
    },

    async deleteDocument(id: string, path: string) {
        const { error: storageError } = await supabase.storage
            .from(BUCKET_NAME)
            .remove([path]);
        if (storageError) throw storageError;

        const { error: dbError } = await supabase
            .from('car_documents')
            .delete()
            .eq('id', id);
        if (dbError) throw dbError;
    },
};
