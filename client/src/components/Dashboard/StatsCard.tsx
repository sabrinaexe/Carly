import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
    label: string;
    value: string | number;
    icon: LucideIcon;
    variant: "blue" | "red" | "orange" | "yellow";
    onClick?: () => void;
    active?: boolean;
}

export function StatsCard({ label, value, icon: Icon, variant, onClick, active }: StatsCardProps) {
    const getVariantStyles = () => {
        switch (variant) {
            case "blue":
                return {
                    bg: "bg-blue-600",
                    shadow: "shadow-lg shadow-blue-600/30 dark:shadow-blue-900/40",
                    text: "text-white",
                    border: active ? "border-blue-600 ring-2 ring-blue-100 dark:ring-blue-900" : "border-slate-100 dark:border-slate-800",
                };
            case "red":
                return {
                    bg: "bg-red-500",
                    shadow: "shadow-lg shadow-red-500/30 dark:shadow-red-900/40",
                    text: "text-white",
                    border: active ? "border-red-500 ring-2 ring-red-100 dark:ring-red-900" : "border-slate-100 dark:border-slate-800",
                };
            case "orange":
                return {
                    bg: "bg-orange-500",
                    shadow: "shadow-lg shadow-orange-500/30 dark:shadow-orange-900/40",
                    text: "text-white",
                    border: active ? "border-orange-500 ring-2 ring-orange-100 dark:ring-orange-900" : "border-slate-100 dark:border-slate-800",
                };
            case "yellow":
                return {
                    bg: "bg-yellow-400",
                    shadow: "shadow-lg shadow-yellow-400/30 dark:shadow-yellow-900/40",
                    text: "text-white",
                    border: active ? "border-yellow-400 ring-2 ring-yellow-100 dark:ring-yellow-900" : "border-slate-100 dark:border-slate-800",
                };
            default:
                return {
                    bg: "bg-blue-600",
                    shadow: "shadow-lg shadow-blue-600/30 dark:shadow-blue-900/40",
                    text: "text-white",
                    border: "border-slate-100 dark:border-slate-800",
                };
        }
    };

    const config = getVariantStyles();

    return (
        <button
            onClick={onClick}
            className={`w-full bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all active:scale-[0.98] border cursor-pointer text-left ${active
                ? 'border-blue-500 dark:border-blue-500 ring-4 ring-blue-500/10 dark:ring-blue-500/20'
                : 'border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800'
                }`}
        >
            <div className="flex items-center justify-between mb-2">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${config.bg} ${config.text} ${config.shadow}`}>
                    <Icon className="w-6 h-6" />
                </div>
                {/* Optional Sparkline or Trend could go here */}
            </div>

            <div className="space-y-1">
                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">{label}</p>
                <div className="flex items-baseline gap-2">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{value}</h3>
                    {/* <span className="text-xs font-bold text-green-500 flex items-center">
                        +12% <ArrowUpRight className="w-3 h-3" />
                    </span> */}
                </div>
            </div>
        </button>
    );
}
