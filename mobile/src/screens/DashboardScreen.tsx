import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    RefreshControl,
    StatusBar,
    ScrollView,
    Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
    Plus,
    Search,
    Car,
    Bike,
    Truck,
    AlertTriangle,
    AlertCircle,
    Timer,
    Zap,
    Bus,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { vehicleService } from '../services/vehicleService';
import type { Vehicle, VehicleType } from '../types/vehicle';
import { colors, spacing, borderRadius, fontSize, shadow } from '../theme';

const { width } = Dimensions.get('window');

const VEHICLE_ICONS: Record<VehicleType, any> = {
    car: Car,
    motorcycle: Bike,
    truck: Truck,
    trailer: Truck,
    scooter: Zap,
    bus: Bus,
};

const getDaysLeft = (dateStr?: string | null) => {
    if (!dateStr) return 999;
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return Math.ceil((date.getTime() - now.getTime()) / 86400000);
};

type FilterStatus = 'all' | 'expired' | 'urgent' | 'soon';

export default function DashboardScreen() {
    const { user } = useAuth();
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
    const insets = useSafeAreaInsets();

    const loadVehicles = useCallback(async () => {
        try {
            const data = await vehicleService.getVehicles();
            setVehicles(data);
        } catch (error) {
            console.error('Error loading vehicles:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadVehicles();
    }, [loadVehicles]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            loadVehicles();
        });
        return unsubscribe;
    }, [navigation, loadVehicles]);

    const onRefresh = () => {
        setRefreshing(true);
        loadVehicles();
    };

    // Stats
    const totalVehicles = vehicles.length;
    const expiredCount = vehicles.filter((v) =>
        [v.insurance_expiry, v.itp_expiry, v.rovinieta_expiry].some(
            (d) => d && getDaysLeft(d) < 0
        )
    ).length;
    const urgentCount = vehicles.filter((v) =>
        [v.insurance_expiry, v.itp_expiry, v.rovinieta_expiry].some((d) => {
            const days = getDaysLeft(d);
            return days >= 0 && days <= 7;
        })
    ).length;
    const soonCount = vehicles.filter((v) =>
        [v.insurance_expiry, v.itp_expiry, v.rovinieta_expiry].some((d) => {
            const days = getDaysLeft(d);
            return days > 7 && days <= 30;
        })
    ).length;

    const stats: { label: string; value: number; color: string; bgColor: string; filter: FilterStatus }[] = [
        { label: 'Total', value: totalVehicles, color: colors.blue[600], bgColor: colors.blue[50], filter: 'all' },
        { label: 'Expirat', value: expiredCount, color: colors.red[600], bgColor: colors.red[50], filter: 'expired' },
        { label: 'Urgent', value: urgentCount, color: colors.orange[500], bgColor: colors.orange[50], filter: 'urgent' },
        { label: 'Curând', value: soonCount, color: colors.yellow[500], bgColor: colors.yellow[50], filter: 'soon' },
    ];

    // Filter
    const filteredVehicles = vehicles.filter((vehicle) => {
        const search = searchTerm.toLowerCase();
        const matchesSearch =
            (vehicle.make || '').toLowerCase().includes(search) ||
            (vehicle.model || '').toLowerCase().includes(search) ||
            (vehicle.license_plate || '').toLowerCase().includes(search);
        if (!matchesSearch) return false;
        if (filterStatus === 'all') return true;
        const daysList = [vehicle.insurance_expiry, vehicle.itp_expiry, vehicle.rovinieta_expiry].map(
            (d) => (d ? getDaysLeft(d) : 999)
        );
        if (filterStatus === 'expired') return daysList.some((d) => d < 0);
        if (filterStatus === 'urgent') return daysList.some((d) => d >= 0 && d <= 7);
        if (filterStatus === 'soon') return daysList.some((d) => d > 7 && d <= 30);
        return true;
    });

    const getVehicleStatus = (vehicle: Vehicle): 'expired' | 'urgent' | 'soon' | undefined => {
        const daysList = [vehicle.insurance_expiry, vehicle.itp_expiry, vehicle.rovinieta_expiry].map(
            (d) => (d ? getDaysLeft(d) : 999)
        );
        if (daysList.some((d) => d < 0)) return 'expired';
        if (daysList.some((d) => d <= 7)) return 'urgent';
        if (daysList.some((d) => d <= 30)) return 'soon';
        return undefined;
    };

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'expired': return colors.red[500];
            case 'urgent': return colors.orange[500];
            case 'soon': return colors.yellow[400];
            default: return colors.transparent;
        }
    };

    const getStatusBadge = (status?: string) => {
        if (!status) return null;
        const badgeColors: Record<string, { bg: string; text: string }> = {
            expired: { bg: colors.red[600], text: colors.white },
            urgent: { bg: colors.orange[500], text: colors.white },
            soon: { bg: colors.yellow[400], text: colors.slate[900] },
        };
        const badgeLabels: Record<string, string> = {
            expired: 'Expirat',
            urgent: 'Urgent',
            soon: 'Curând',
        };
        const c = badgeColors[status];
        return (
            <View style={[styles.statusBadge, { backgroundColor: c.bg }]}>
                <Text style={[styles.statusBadgeText, { color: c.text }]}>
                    {badgeLabels[status] || status}
                </Text>
            </View>
        );
    };

    const renderVehicleCard = ({ item }: { item: Vehicle }) => {
        const Icon = VEHICLE_ICONS[item.type] || Car;
        const status = getVehicleStatus(item);
        const statusColor = getStatusColor(status);

        return (
            <TouchableOpacity
                style={[
                    styles.vehicleCard,
                    status === 'expired' && { borderColor: colors.red[900], borderWidth: 1 },
                ]}
                onPress={() => navigation.navigate('VehicleDetails', { id: item.id })}
                activeOpacity={0.7}
            >
                {statusColor !== colors.transparent && (
                    <View style={[styles.statusBar, { backgroundColor: statusColor }]} />
                )}
                {getStatusBadge(status)}
                <View style={styles.vehicleIconContainer}>
                    <Icon size={40} color={colors.slate[400]} strokeWidth={1.5} />
                </View>
                <Text style={styles.vehicleName} numberOfLines={1}>
                    {item.make} {item.model}
                </Text>
                <View style={styles.vehicleMeta}>
                    <View style={styles.typeBadge}>
                        <Text style={styles.typeBadgeText}>{item.type.toUpperCase()}</Text>
                    </View>
                    {item.license_plate && item.license_plate !== 'N/A' && (
                        <Text style={styles.licensePlate}>{item.license_plate}</Text>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    const cardWidth = (width - spacing.lg * 2 - spacing.md) / 2;

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="light-content" backgroundColor={colors.slate[50]} />
            <FlatList
                data={filteredVehicles}
                renderItem={renderVehicleCard}
                keyExtractor={(item) => item.id}
                numColumns={2}
                columnWrapperStyle={styles.row}
                contentContainerStyle={[styles.listContent, { paddingBottom: 110 + insets.bottom }]}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.blue[600]} />}
                ListHeaderComponent={
                    <View>
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.headerTitle}>Garajul meu</Text>
                            <Text style={styles.headerSubtitle}>
                                Gestionează vehiculele și urmărește datele importante
                            </Text>
                        </View>

                        {/* Alert Banner */}
                        {(expiredCount > 0 || urgentCount > 0) && (
                            <TouchableOpacity style={styles.alertBanner} activeOpacity={0.8}>
                                <AlertTriangle size={20} color={colors.white} />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.alertTitle}>Atenție urgentă necesară</Text>
                                    <Text style={styles.alertMessage}>
                                        {expiredCount + urgentCount} vehicul(e) necesită atenție.
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        )}

                        {/* Stats */}
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.statsScroll}
                            contentContainerStyle={styles.statsContainer}
                        >
                            {stats.map((stat) => (
                                <TouchableOpacity
                                    key={stat.label}
                                    style={[
                                        styles.statsCard,
                                        { backgroundColor: stat.bgColor },
                                        filterStatus === stat.filter && styles.statsCardActive,
                                    ]}
                                    onPress={() => setFilterStatus(stat.filter)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.statsValue, { color: stat.color }]}>{stat.value}</Text>
                                    <Text style={[styles.statsLabel, { color: stat.color }]}>{stat.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* Search */}
                        <View style={styles.searchContainer}>
                            <Search size={18} color={colors.slate[400]} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Filtrează după nr., marcă sau model..."
                                placeholderTextColor={colors.slate[400]}
                                value={searchTerm}
                                onChangeText={setSearchTerm}
                            />
                        </View>

                        {filterStatus !== 'all' && (
                            <TouchableOpacity
                                onPress={() => setFilterStatus('all')}
                                style={styles.clearFilter}
                            >
                                <Text style={styles.clearFilterText}>
                                    Șterge filtrul "{filterStatus}"
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Car size={48} color={colors.slate[300]} strokeWidth={1} />
                        <Text style={styles.emptyText}>
                            {loading ? 'Se încarcă...' : 'Niciun vehicul găsit'}
                        </Text>
                    </View>
                }
            />

            {/* FAB */}
            <TouchableOpacity
                style={[styles.fab, { bottom: 10 + insets.bottom }]}
                onPress={() => navigation.navigate('AddVehicle')}
                activeOpacity={0.8}
            >
                <Plus size={24} color={colors.white} strokeWidth={2.5} />
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.slate[50],
    },
    listContent: {
        padding: spacing.lg,
    },
    row: {
        gap: spacing.md,
        marginBottom: spacing.md,
    },
    header: {
        marginBottom: spacing.xl,
    },
    headerTitle: {
        fontSize: fontSize['4xl'],
        fontWeight: '800',
        color: colors.slate[900],
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: fontSize.lg,
        color: colors.slate[500],
        marginTop: spacing.sm,
    },
    alertBanner: {
        backgroundColor: colors.red[500],
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        marginBottom: spacing.xl,
        ...shadow.md,
    },
    alertTitle: {
        color: colors.white,
        fontSize: fontSize.md,
        fontWeight: '700',
    },
    alertMessage: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: fontSize.sm,
        marginTop: 2,
    },
    statsScroll: {
        marginBottom: spacing.xl,
        marginHorizontal: -spacing.lg,
    },
    statsContainer: {
        paddingHorizontal: spacing.lg,
        gap: spacing.md,
    },
    statsCard: {
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.lg,
        borderRadius: borderRadius.xl,
        alignItems: 'center',
        minWidth: 80,
        borderWidth: 2,
        borderColor: colors.transparent,
    },
    statsCardActive: {
        borderColor: colors.blue[600],
    },
    statsValue: {
        fontSize: fontSize['2xl'],
        fontWeight: '800',
    },
    statsLabel: {
        fontSize: fontSize.xs,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginTop: 2,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.white,
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.lg,
        borderWidth: 1,
        borderColor: colors.slate[200],
        marginBottom: spacing.lg,
        gap: spacing.sm,
    },
    searchInput: {
        flex: 1,
        paddingVertical: spacing.md,
        fontSize: fontSize.md,
        color: colors.slate[900],
    },
    clearFilter: {
        alignSelf: 'flex-start',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.sm,
        marginBottom: spacing.md,
    },
    clearFilterText: {
        color: colors.blue[600],
        fontSize: fontSize.sm,
        fontWeight: '700',
    },
    vehicleCard: {
        flex: 1,
        maxWidth: '48%',
        aspectRatio: 1 / 1.15,
        backgroundColor: colors.white,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.slate[200],
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        ...shadow.sm,
    },
    statusBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 4,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
    },
    statusBadge: {
        position: 'absolute',
        top: spacing.sm,
        right: spacing.sm,
        paddingHorizontal: spacing.sm,
        paddingVertical: 3,
        borderRadius: borderRadius.full,
        zIndex: 10,
    },
    statusBadgeText: {
        fontSize: 9,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    vehicleIconContainer: {
        width: '100%',
        aspectRatio: 4 / 3,
        backgroundColor: colors.slate[50],
        borderRadius: borderRadius.lg,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    vehicleName: {
        fontSize: fontSize.md,
        fontWeight: '700',
        color: colors.slate[900],
        textAlign: 'center',
    },
    vehicleMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginTop: spacing.xs,
    },
    typeBadge: {
        backgroundColor: colors.slate[100],
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: borderRadius.sm,
    },
    typeBadgeText: {
        fontSize: 9,
        fontWeight: '800',
        color: colors.slate[500],
        letterSpacing: 0.5,
    },
    licensePlate: {
        fontSize: fontSize.xs,
        color: colors.slate[400],
        fontWeight: '500',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing['4xl'] * 2,
        gap: spacing.lg,
    },
    emptyText: {
        fontSize: fontSize.lg,
        color: colors.slate[400],
    },
    fab: {
        position: 'absolute',
        right: spacing.xl,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.blue[600],
        justifyContent: 'center',
        alignItems: 'center',
        ...shadow.blue,
    },
});
