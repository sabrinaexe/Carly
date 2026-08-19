import { LayoutGrid, Plus, Bell, LogOut, CarFront } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export function Sidebar() {
    const location = useLocation();
    const { user, signOut } = useAuth();

    const isActive = (path: string) => location.pathname === path;



    return (
        <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 flex-col transition-colors duration-300 z-50">
            {/* Header */}
            <div className="p-6">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                        <CarFront className="w-6 h-6" />
                    </div>
                    <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Carly</span>
                </div>

                <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 px-2">Meniu</div>

                <nav className="space-y-1">
                    <Link
                        to="/"
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${isActive('/')
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                    >
                        <LayoutGrid className="w-5 h-5" />
                        Dashboard
                    </Link>

                    <Link
                        to="/?add=true"
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${isActive('/add-car')
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                    >
                        <Plus className="w-5 h-5" />
                        Adaugă vehicul
                    </Link>

                    <Link
                        to="/notifications"
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${isActive('/notifications')
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                    >
                        <Bell className="w-5 h-5" />
                        Notificări
                    </Link>
                </nav>
            </div>

            <div className="flex-1" />

            {/* Footer / User Profile */}
            <div className="p-4 border-t border-slate-50 dark:border-slate-800">
                <Link to="/profile" className="flex items-center gap-3 mb-4 px-2 hover:bg-slate-50 dark:hover:bg-slate-800 p-2 rounded-xl transition-colors cursor-pointer group">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300 group-hover:bg-blue-100 dark:group-hover:bg-blue-900 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {/* Avatar */}
                        <div className="font-bold text-lg">
                            {user?.user_metadata?.full_name ? user.user_metadata.full_name[0].toUpperCase() : user?.email?.[0].toUpperCase()}
                        </div>
                    </div>
                    <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-200 truncate">
                            {user?.user_metadata?.full_name || 'Utilizator'}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {user?.email}
                        </span>
                    </div>
                </Link>

                <button
                    onClick={signOut}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-100 dark:hover:border-red-900/30 transition-all text-sm font-medium"
                >
                    <LogOut className="w-4 h-4" />
                    Ieșire
                </button>
            </div>
        </aside>
    );
}
