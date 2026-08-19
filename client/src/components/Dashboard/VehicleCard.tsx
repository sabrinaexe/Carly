import type { Vehicle, VehicleType } from "../../types/vehicle";
import { AlertCircle, AlertTriangle, Calendar, Car, Bike, Truck, Caravan, Zap, Bus } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface VehicleCardProps {
    vehicle: Vehicle;
    status?: "expired" | "urgent" | "soon" | "ok";
}

const VEHICLE_ICONS: Record<VehicleType, any> = {
    car: Car,
    motorcycle: Bike,
    truck: Truck,
    trailer: Caravan,
    scooter: Zap,
    bus: Bus
};

export function VehicleCard({ vehicle, status }: VehicleCardProps) {
    const navigate = useNavigate();

    const Icon = VEHICLE_ICONS[vehicle.type] || Car;

    const getStatusBadge = () => {
        switch (status) {
            case "expired":
                return (
                    <div className="absolute top-4 right-4 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm z-10">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Expired</span>
                    </div>
                );
            case "urgent":
                return (
                    <div className="absolute top-4 right-4 bg-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm z-10">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Urgent</span>
                    </div>
                );
            case "soon":
                return (
                    <div className="absolute top-4 right-4 bg-yellow-400 text-slate-900 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm z-10">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Soon</span>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div
            onClick={() => navigate(`/vehicle/${vehicle.id}`)}
            className={`bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border flex flex-col items-center hover:shadow-md transition-all cursor-pointer relative group ${status ? status === 'expired' ? 'border-red-100 dark:border-red-900' : 'border-slate-100 dark:border-slate-800' : 'border-slate-100 dark:border-slate-800'}`}
        >
            {getStatusBadge()}

            <div className="w-full aspect-[4/3] flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-xl mb-4 p-4 relative overflow-hidden">
                <Icon className="w-20 h-20 text-slate-400 dark:text-slate-500 group-hover:scale-110 transition-transform duration-300 drop-shadow-md" />
            </div>

            <div className="flex flex-col items-center">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white text-center">{vehicle.make} {vehicle.model}</h3>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase tracking-wider">{vehicle.type}</span>
                    <p className="text-slate-400 dark:text-slate-500 font-medium text-sm">{vehicle.license_plate === 'N/A' ? '' : vehicle.license_plate}</p>
                </div>
            </div>

            {/* Decorative colored bar at top if status exists */}
            {status === "expired" && (
                <div className="absolute top-0 left-0 w-full h-1.5 bg-red-500 rounded-t-2xl" />
            )}
            {status === "urgent" && (
                <div className="absolute top-0 left-0 w-full h-1.5 bg-orange-500 rounded-t-2xl" />
            )}
            {status === "soon" && (
                <div className="absolute top-0 left-0 w-full h-1.5 bg-yellow-400 rounded-t-2xl" />
            )}
        </div>
    );
}
