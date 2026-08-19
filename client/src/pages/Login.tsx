import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { supabase } from '../services/supabase'
import { useNavigate } from 'react-router-dom'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [mode, setMode] = useState<'signin' | 'signup'>('signin')
    const [showPassword, setShowPassword] = useState(false)
    const navigate = useNavigate()

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            if (mode === 'signup') {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                })
                if (error) throw error
                alert('Verifică-ți emailul pentru linkul de autentificare!')
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })
                if (error) throw error
                navigate('/')
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors duration-300">
            <div className="w-full max-w-md space-y-8 rounded-[2rem] bg-white dark:bg-slate-900 p-10 shadow-xl border border-slate-100 dark:border-slate-800 transition-all">
                <div className="text-center">
                    <div className="inline-flex p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/30 mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><path d="M8 12h8" /><path d="M12 8v8" /></svg> {/* Placeholder icon or CarIcon */}
                    </div>
                    <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        {mode === 'signin' ? 'Bine ai revenit' : 'Creează cont'}
                    </h2>
                    <p className="mt-3 text-slate-500 dark:text-slate-400 font-medium">
                        Autentifică-te pentru a gestiona garajul tău
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleAuth}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Adresă de email</label>
                            <input
                                type="email"
                                required
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3.5 text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Parolă</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3.5 pr-12 text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-600 flex items-center gap-2 border border-red-100">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="group relative flex w-full justify-center rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-bold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/30 active:scale-[0.98]"
                    >
                        {loading ? 'Se procesează...' : mode === 'signin' ? 'Autentificare' : 'Creează cont'}
                    </button>

                    <div className="text-center">
                        <button
                            type="button"
                            className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-500 hover:underline transition-all"
                            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                        >
                            {mode === 'signin'
                                ? 'Nu ai cont? Înregistrează-te'
                                : 'Ai deja cont? Autentifică-te'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
