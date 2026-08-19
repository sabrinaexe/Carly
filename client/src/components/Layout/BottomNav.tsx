import { LayoutGrid, Plus, Bell, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export function BottomNav() {
    const location = useLocation();
    const isActive = (path: string) => location.pathname === path;

    const tabs = [
        { to: "/", icon: LayoutGrid, label: "Dashboard" },
        { to: "/?add=true", icon: Plus, label: "Adaugă", matchPath: "/add" },
        { to: "/notifications", icon: Bell, label: "Notificări" },
        { to: "/profile", icon: User, label: "Profil" },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-stretch"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
            {tabs.map(({ to, icon: Icon, label, matchPath }) => {
                const active = isActive(matchPath ?? to.split('?')[0]);
                return (
                    <Link
                        key={label}
                        to={to}
                        className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-colors ${
                            active
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    >
                        <Icon className="w-5 h-5" />
                        <span className="text-[10px] font-semibold">{label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
