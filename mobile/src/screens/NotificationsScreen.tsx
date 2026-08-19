import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    Bell,
    Calendar,
    AlertTriangle,
    AlertCircle,
    CheckCircle2,
} from 'lucide-react-native';
import { vehicleService } from '../services/vehicleService';
import { colors, spacing, borderRadius, fontSize, shadow } from '../theme';

type NotificationItem = {
    id: string;
    type: 'expired' | 'urgent' | 'upcoming';
    title: string;
    message: string;
    date: string;
    vehicleId: string;
};

const getDaysLeft = (dateStr: string) => {
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return Math.ceil((date.getTime() - now.getTime()) / 86400000);
};

export default function NotificationsScreen() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const insets = useSafeAreaInsets();

    useEffect(() => {
        loadNotifications();
    }, []);

    async function loadNotifications() {
        try {
            const vehicles = await vehicleService.getVehicles();
            const newNotifications: NotificationItem[] = [];

            vehicles.forEach((vehicle) => {
                const checks = [
                    { type: 'Asigurare', date: vehicle.insurance_expiry },
                    { type: 'ITP', date: vehicle.itp_expiry },
                    { type: 'Rovinieta', date: vehicle.rovinieta_expiry },
                ];

                checks.forEach((check) => {
                    if (!check.date) return;
                    const daysLeft = getDaysLeft(check.date);

                    if (daysLeft < 0) {
                        newNotifications.push({
                            id: `${vehicle.id}-${check.type}-expired`,
                            type: 'expired',
                            title: `${check.type} expirat`,
                            message: `${check.type} pentru ${vehicle.make} ${vehicle.model} (${vehicle.license_plate}) a expirat pe ${new Date(check.date).toLocaleDateString('ro-RO')}.`,
                            date: check.date,
                            vehicleId: vehicle.id,
                        });
                    } else if (daysLeft <= 7) {
                        newNotifications.push({
                            id: `${vehicle.id}-${check.type}-urgent`,
                            type: 'urgent',
                            title: `${check.type} expiră curând`,
                            message: `${check.type} pentru ${vehicle.make} ${vehicle.model} (${vehicle.license_plate}) expiră în ${daysLeft} zile.`,
                            date: check.date,
                            vehicleId: vehicle.id,
                        });
                    } else if (daysLeft <= 30) {
                        newNotifications.push({
                            id: `${vehicle.id}-${check.type}-upcoming`,
                            type: 'upcoming',
                            title: `Expirare ${check.type} în curând`,
                            message: `${check.type} pentru ${vehicle.make} ${vehicle.model} (${vehicle.license_plate}) expiră în ${daysLeft} zile.`,
                            date: check.date,
                            vehicleId: vehicle.id,
                        });
                    }
                });
            });

            newNotifications.sort((a, b) => {
                if (a.type === 'expired' && b.type !== 'expired') return -1;
                if (a.type !== 'expired' && b.type === 'expired') return 1;
                return new Date(a.date).getTime() - new Date(b.date).getTime();
            });

            setNotifications(newNotifications);
        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    const onRefresh = () => {
        setRefreshing(true);
        loadNotifications();
    };

    const getIcon = (type: NotificationItem['type']) => {
        switch (type) {
            case 'expired': return <AlertCircle size={22} color={colors.red[400]} />;
            case 'urgent': return <AlertTriangle size={22} color={colors.orange[400]} />;
            case 'upcoming': return <Calendar size={22} color={colors.yellow[400]} />;
        }
    };

    const getBgColor = (type: NotificationItem['type']) => {
        switch (type) {
            case 'expired': return { bg: colors.white, border: colors.red[900] };
            case 'urgent': return { bg: colors.white, border: colors.orange[900] };
            case 'upcoming': return { bg: colors.white, border: colors.yellow[900] };
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <ScrollView
                style={styles.container}
                contentContainerStyle={[styles.content, { paddingBottom: spacing['4xl'] + insets.bottom }]}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.blue[600]} />}
            >
                <StatusBar barStyle="light-content" backgroundColor={colors.slate[50]} />
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerIcon}>
                        <Bell size={24} color={colors.blue[600]} />
                    </View>
                    <View>
                        <Text style={styles.headerTitle}>Notificări</Text>
                        <Text style={styles.headerSubtitle}>Fii la curent cu starea vehiculelor tale</Text>
                    </View>
                </View>

                {loading ? (
                    <Text style={styles.loadingText}>Se încarcă notificările...</Text>
                ) : notifications.length === 0 ? (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIcon}>
                            <CheckCircle2 size={32} color={colors.slate[300]} />
                        </View>
                        <Text style={styles.emptyTitle}>Totul este în regulă</Text>
                        <Text style={styles.emptySubtitle}>Nu ai notificări noi.</Text>
                    </View>
                ) : (
                    <View style={styles.list}>
                        {notifications.map((notification) => {
                            const colorConfig = getBgColor(notification.type);
                            return (
                                <View
                                    key={notification.id}
                                    style={[
                                        styles.notificationCard,
                                        { backgroundColor: colorConfig.bg, borderColor: colorConfig.border },
                                    ]}
                                >
                                    <View style={styles.notificationIcon}>{getIcon(notification.type)}</View>
                                    <View style={{ flex: 1 }}>
                                        <View style={styles.notificationHeader}>
                                            <Text style={styles.notificationTitle}>{notification.title}</Text>
                                            <Text style={styles.notificationDate}>
                                                {new Date(notification.date).toLocaleDateString()}
                                            </Text>
                                        </View>
                                        <Text style={styles.notificationMessage}>{notification.message}</Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.slate[50] },
    content: { padding: spacing.lg },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.lg,
        marginBottom: spacing['2xl'],
    },
    headerIcon: {
        width: 48,
        height: 48,
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.slate[200],
        borderRadius: borderRadius.xl,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: fontSize['3xl'],
        fontWeight: '800',
        color: colors.slate[900],
    },
    headerSubtitle: {
        fontSize: fontSize.md,
        color: colors.slate[500],
        marginTop: 2,
    },
    loadingText: {
        textAlign: 'center',
        color: colors.slate[400],
        paddingVertical: spacing['4xl'],
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: spacing['4xl'] * 2,
        backgroundColor: colors.white,
        borderRadius: borderRadius['2xl'],
        borderWidth: 1,
        borderColor: colors.slate[200],
        ...shadow.sm,
    },
    emptyIcon: {
        width: 64,
        height: 64,
        backgroundColor: colors.slate[100],
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    emptyTitle: {
        fontSize: fontSize.xl,
        fontWeight: '800',
        color: colors.slate[900],
    },
    emptySubtitle: {
        fontSize: fontSize.md,
        color: colors.slate[500],
        marginTop: spacing.xs,
    },
    list: { gap: spacing.md },
    notificationCard: {
        flexDirection: 'row',
        padding: spacing.lg,
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        alignItems: 'flex-start',
        gap: spacing.md,
    },
    notificationIcon: {
        padding: spacing.sm,
        backgroundColor: colors.slate[100],
        borderRadius: borderRadius.lg,
    },
    notificationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    notificationTitle: {
        fontSize: fontSize.md,
        fontWeight: '700',
        color: colors.slate[900],
    },
    notificationDate: {
        fontSize: fontSize.xs,
        fontWeight: '600',
        color: colors.slate[400],
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    notificationMessage: {
        fontSize: fontSize.sm,
        color: colors.slate[600],
        lineHeight: 20,
    },
});
