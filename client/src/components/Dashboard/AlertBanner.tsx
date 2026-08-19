import { TriangleAlert } from "lucide-react";

interface AlertBannerProps {
    title: string;
    message: string;
    onClick?: () => void;
}

export function AlertBanner({ title, message, onClick }: AlertBannerProps) {
    return (
        <div
            onClick={onClick}
            className={`flex items-start gap-4 p-4 mb-6 rounded-xl border border-red-100 dark:border-red-900 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 ${onClick ? 'cursor-pointer hover:bg-red-100/50 dark:hover:bg-red-900/30 transition-colors active:scale-[0.99]' : ''}`}
        >
            <div className="bg-white dark:bg-red-950 p-2 rounded-lg shadow-sm shrink-0">
                <TriangleAlert className="w-5 h-5 text-red-600 dark:text-red-500" />
            </div>
            <div className="flex-1">
                <h3 className="font-bold text-lg mb-1">{title}</h3>
                <p className="text-sm opacity-90 leading-relaxed max-w-2xl">{message}</p>
                {onClick && (
                    <div className="mt-3 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                        View List <span>→</span>
                    </div>
                )}
            </div>
        </div>
    )
}
