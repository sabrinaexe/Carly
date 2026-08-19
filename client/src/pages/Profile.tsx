import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/supabase'
import { User, Mail, Save, LogOut } from 'lucide-react'
import { toast } from 'sonner'

export default function Profile() {
    const { user, signOut } = useAuth()
    const [loading, setLoading] = useState(false)
    const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '')

    async function updateProfile() {
        setLoading(true)
        try {
            const { error } = await supabase.auth.updateUser({
                data: { full_name: fullName }
            })

            if (error) throw error
            toast.success('Profil actualizat cu succes')
        } catch (error) {
            console.error('Error updating profile:', error)
            toast.error('Nu s-a putut actualiza profilul')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Profilul meu</h1>
            <p className="text-slate-500 dark:text-slate-400 mb-8">Gestionează setările și preferințele contului</p>

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="p-8 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center gap-6">
                    <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 text-2xl font-bold">
                        {fullName ? fullName[0].toUpperCase() : user?.email?.[0].toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{fullName || 'Utilizator'}</h2>
                        <p className="text-slate-500 dark:text-slate-400">{user?.email}</p>
                    </div>
                </div>

                <div className="p-8 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Nume complet
                        </label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-500 outline-none transition-all text-slate-900 dark:text-white"
                                placeholder="Introduți numele complet"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Adresă de email
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input
                                type="email"
                                value={user?.email || ''}
                                readOnly
                                disabled
                                className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 cursor-not-allowed"
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-50 dark:border-slate-800 p-8">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <button
                            onClick={signOut}
                            className="px-6 py-3 text-red-600 dark:text-red-400 font-medium hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors flex items-center gap-2 border border-red-100 dark:border-red-900/30 sm:border-transparent"
                        >
                            <LogOut className="w-5 h-5" />
                            Ieșire din cont
                        </button>

                        <button
                            onClick={updateProfile}
                            disabled={loading}
                            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200/50 dark:shadow-blue-900/10 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? 'Se salvează...' : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Salvează modificările
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
