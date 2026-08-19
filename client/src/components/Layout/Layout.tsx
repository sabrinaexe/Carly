import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import type { ReactNode } from "react";

interface LayoutProps {
    children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors">
            <Sidebar />
            <main className="flex-1 md:ml-64 overflow-y-auto h-full">
                <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto pb-24 md:pb-8">
                    {children}
                </div>
            </main>
            <BottomNav />
        </div>
    );
}
