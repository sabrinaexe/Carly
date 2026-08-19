import { useState, useEffect } from 'react'
import { X, Upload, FileText, Trash2, Eye } from 'lucide-react'
import { documentService } from '../services/documentService'
import type { VehicleDocument } from '../types/vehicle'

type DocumentManagerProps = {
    vehicleId: string
    onClose: () => void
}

export default function DocumentManager({ vehicleId, onClose }: DocumentManagerProps) {
    const [docs, setDocs] = useState<VehicleDocument[]>([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)

    useEffect(() => {
        loadDocs()
    }, [vehicleId])

    async function loadDocs() {
        try {
            const data = await documentService.getDocuments(vehicleId)
            setDocs(data)
        } catch (error) {
            console.error('Error loading docs:', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>, type: VehicleDocument['file_type']) {
        if (!e.target.files || e.target.files.length === 0) return

        const file = e.target.files[0]
        setUploading(true)
        try {
            await documentService.uploadDocument(vehicleId, file, type)
            await loadDocs()
        } catch (error) {
            console.error('Error uploading:', error)
            alert('Upload failed')
        } finally {
            setUploading(false)
        }
    }

    async function handleView(path: string) {
        try {
            const url = await documentService.getDownloadUrl(path)
            window.open(url, '_blank')
        } catch (error) {
            console.error('Error getting URL:', error)
        }
    }

    async function handleDelete(id: string, path: string) {
        if (!confirm('Are you sure you want to delete this document?')) return
        try {
            await documentService.deleteDocument(id, path)
            setDocs(docs.filter(d => d.id !== id))
        } catch (error) {
            console.error('Error deleting:', error)
        }
    }

    return (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 w-full max-w-2xl relative h-[80vh] flex flex-col animate-in fade-in zoom-in duration-200 shadow-2xl">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-all"
                >
                    <X size={20} />
                </button>

                <h2 className="text-xl font-bold mb-6 text-slate-800 flex items-center gap-2">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                        <FileText size={20} />
                    </div>
                    Vehicle Documents
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                    {['insurance', 'itp', 'rovinieta', 'other'].map(type => (
                        <label key={type} className={`
                            flex flex-col items-center justify-center p-4 border border-dashed rounded-2xl cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg
                            ${uploading ? 'opacity-50 cursor-not-allowed border-slate-200 bg-slate-50' : 'border-slate-300 hover:border-blue-500 hover:bg-blue-50 text-slate-500 hover:text-blue-600'}
                        `}>
                            <Upload size={24} className="mb-2 opacity-80" />
                            <span className="text-sm font-bold capitalize">{type}</span>
                            <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                className="hidden"
                                disabled={uploading}
                                onChange={(e) => handleUpload(e, type as VehicleDocument['file_type'])}
                            />
                        </label>
                    ))}
                </div>

                <div className="flex-1 overflow-auto pr-2 scrollbar-thin">
                    {loading ? (
                        <div className="text-center text-slate-400 py-8">Loading documents...</div>
                    ) : docs.length === 0 ? (
                        <div className="text-center text-slate-500 py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            No documents uploaded yet.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {docs.map(doc => (
                                <div key={doc.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl group hover:border-blue-200 hover:shadow-md transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800">{doc.name}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 uppercase tracking-wider">{doc.file_type}</span>
                                                <span className="text-xs text-slate-400 font-medium">
                                                    {new Date(doc.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleView(doc.file_path)}
                                            className="p-2 hover:bg-blue-50 rounded-xl text-slate-400 hover:text-blue-600 transition-colors"
                                            title="View"
                                        >
                                            <Eye size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(doc.id, doc.file_path)}
                                            className="p-2 hover:bg-red-50 rounded-xl text-slate-400 hover:text-red-500 transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
