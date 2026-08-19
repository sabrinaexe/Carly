import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Platform,
    StatusBar,
    Modal,
    Dimensions,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LineChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import {
    ArrowLeft,
    Plus,
    Trash2,
    Wrench,
    DollarSign,
    Calendar,
    Gauge,
    FileText,
} from 'lucide-react-native';
import { maintenanceService } from '../services/maintenanceService';
import type { MaintenanceLog } from '../types/vehicle';
import { colors, spacing, borderRadius, fontSize, shadow } from '../theme';

type RouteParams = {
    MaintenanceLogs: { vehicleId: string };
};

export default function MaintenanceLogsScreen() {
    const route = useRoute<RouteProp<RouteParams, 'MaintenanceLogs'>>();
    const navigation = useNavigation<any>();
    const vehicleId = route.params.vehicleId;

    const [logs, setLogs] = useState<MaintenanceLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const screenWidth = Dimensions.get('window').width;

    const [newLog, setNewLog] = useState({
        service_date: new Date().toISOString().split('T')[0],
        description: '',
        cost: '',
        odometer: '',
        notes: '',
    });

    const loadLogs = useCallback(async () => {
        try {
            const data = await maintenanceService.getLogs(vehicleId);
            setLogs(data);
        } catch (error) {
            console.error('Error loading logs:', error);
        } finally {
            setLoading(false);
        }
    }, [vehicleId]);

    useEffect(() => {
        loadLogs();
    }, [loadLogs]);

    const handleAddLog = async () => {
        if (!newLog.description) {
            Alert.alert('Eroare', 'Te rugăm să introduci o descriere');
            return;
        }
        setSubmitting(true);
        try {
            await maintenanceService.addLog({
                car_id: vehicleId,
                service_date: newLog.service_date,
                description: newLog.description,
                cost: parseFloat(newLog.cost) || 0,
                odometer: newLog.odometer ? parseInt(newLog.odometer) : undefined,
                notes: newLog.notes || undefined,
            });
            setNewLog({
                service_date: new Date().toISOString().split('T')[0],
                description: '',
                cost: '',
                odometer: '',
                notes: '',
            });
            setShowAddForm(false);
            await loadLogs();
            Alert.alert('Succes', 'Înregistrare de întreținere adăugată');
        } catch (error) {
            console.error('Error adding log:', error);
            Alert.alert('Eroare', 'Nu s-a putut adăuga înregistrarea de întreținere');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteLog = (logId: string) => {
        Alert.alert('Șterge înregistrarea', 'Ești sigur că vrei să ștergi această înregistrare?', [
            { text: 'Anulează', style: 'cancel' },
            {
                text: 'Șterge',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await maintenanceService.deleteLog(logId);
                        setLogs(logs.filter((l) => l.id !== logId));
                    } catch (error) {
                        Alert.alert('Eroare', 'Nu s-a putut șterge înregistrarea');
                    }
                },
            },
        ]);
    };

    const totalCost = logs.reduce((sum, log) => sum + (log.cost || 0), 0);

    const getChartData = () => {
        if (logs.length === 0) return { labels: ['No Data'], datasets: [{ data: [0] }] };
        const sorted = [...logs].sort((a, b) => new Date(a.service_date).getTime() - new Date(b.service_date).getTime());
        // Last 6 entries to avoid squishing
        const recent = sorted.slice(-6);
        return {
            labels: recent.map(l => new Date(l.service_date).toLocaleDateString(undefined, { month: 'short' }) + (recent.length > 4 ? '' : ' ' + new Date(l.service_date).getDate())),
            datasets: [{ data: recent.map(l => l.cost || 0) }]
        };
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.blue[600]} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="light-content" backgroundColor={colors.slate[50]} />
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ArrowLeft size={22} color={colors.slate[500]} />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.headerTitle}>Jurnal de întreținere</Text>
                        <Text style={styles.headerSubtitle}>Urmărește istoricul serviciilor și costurile</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => setShowAddForm(!showAddForm)}
                    >
                        <Plus size={20} color={colors.white} />
                    </TouchableOpacity>
                </View>

                {/* Summary Card */}
                <View style={styles.summaryCard}>
                    <View style={styles.summaryItem}>
                        <Wrench size={20} color={colors.blue[600]} />
                        <Text style={styles.summaryValue}>{logs.length}</Text>
                        <Text style={styles.summaryLabel}>Total înregistrări</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryItem}>
                        <DollarSign size={20} color={colors.green[500]} />
                        <Text style={styles.summaryValue}>{totalCost.toFixed(0)}</Text>
                        <Text style={styles.summaryLabel}>Cost total</Text>
                    </View>
                </View>

                {/* Graph Card */}
                {logs.length > 0 && (
                    <View style={styles.chartCard}>
                        <Text style={styles.chartTitle}>Istoric costuri</Text>
                        <LineChart
                            data={getChartData()}
                            width={screenWidth - spacing.lg * 2 - spacing.xl * 2} // container margin and padding
                            height={180}
                            chartConfig={{
                                backgroundColor: colors.white,
                                backgroundGradientFrom: colors.white,
                                backgroundGradientTo: colors.white,
                                decimalPlaces: 0,
                                color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
                                labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
                                style: { borderRadius: 16 },
                                propsForDots: { r: '4', strokeWidth: '2', stroke: colors.blue[600] },
                            }}
                            bezier
                            style={{ marginVertical: 8, borderRadius: 16 }}
                            yAxisLabel="$"
                            yAxisSuffix=""
                        />
                    </View>
                )}

                {/* Add Form */}
                {showAddForm && (
                    <View style={styles.formCard}>
                        <Text style={styles.formTitle}>Intrare nouă</Text>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Data</Text>
                            <TouchableOpacity
                                style={[styles.fieldInput, { justifyContent: 'center' }]}
                                onPress={() => setShowDatePicker(!showDatePicker)}
                            >
                                <Text style={{ color: newLog.service_date ? colors.slate[900] : colors.slate[400] }}>
                                    {newLog.service_date ? new Date(newLog.service_date).toLocaleDateString() : 'YYYY-MM-DD'}
                                </Text>
                            </TouchableOpacity>

                            {showDatePicker && (
                                Platform.OS === 'ios' ? (
                                    <Modal visible={true} transparent={true} animationType="slide">
                                        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                                            <View style={{ backgroundColor: colors.white, paddingBottom: 40 }}>
                                                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.slate[100] }}>
                                                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                                        <Text style={{ color: colors.blue[600], fontWeight: '700', fontSize: fontSize.md }}>Gata</Text>
                                                    </TouchableOpacity>
                                                </View>
                                                <DateTimePicker
                                                    value={new Date(newLog.service_date || new Date())}
                                                    mode="date"
                                                    display="spinner"
                                                    textColor={colors.black}
                                                    onChange={(event, selectedDate) => {
                                                        if (selectedDate) {
                                                            setNewLog({ ...newLog, service_date: selectedDate.toISOString().split('T')[0] });
                                                        }
                                                    }}
                                                />
                                            </View>
                                        </View>
                                    </Modal>
                                ) : (
                                    <DateTimePicker
                                        value={new Date(newLog.service_date || new Date())}
                                        mode="date"
                                        display="default"
                                        onChange={(event, selectedDate) => {
                                            setShowDatePicker(false);
                                            if (selectedDate) {
                                                setNewLog({ ...newLog, service_date: selectedDate.toISOString().split('T')[0] });
                                            }
                                        }}
                                    />
                                )
                            )}
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Descriere *</Text>
                            <TextInput
                                style={[styles.fieldInput, { minHeight: 60, textAlignVertical: 'top' }]}
                                value={newLog.description}
                                onChangeText={(v) => setNewLog({ ...newLog, description: v })}
                                placeholder="Schimb ulei, plăcuțe frână, etc."
                                placeholderTextColor={colors.slate[400]}
                                multiline
                            />
                        </View>
                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>Cost</Text>
                                <TextInput
                                    style={styles.fieldInput}
                                    value={newLog.cost}
                                    onChangeText={(v) => setNewLog({ ...newLog, cost: v })}
                                    keyboardType="numeric"
                                    placeholder="0"
                                    placeholderTextColor={colors.slate[400]}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>Odometru</Text>
                                <TextInput
                                    style={styles.fieldInput}
                                    value={newLog.odometer}
                                    onChangeText={(v) => setNewLog({ ...newLog, odometer: v })}
                                    keyboardType="numeric"
                                    placeholder="km"
                                    placeholderTextColor={colors.slate[400]}
                                />
                            </View>
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Note</Text>
                            <TextInput
                                style={styles.fieldInput}
                                value={newLog.notes}
                                onChangeText={(v) => setNewLog({ ...newLog, notes: v })}
                                placeholder="Note opționale"
                                placeholderTextColor={colors.slate[400]}
                            />
                        </View>
                        <View style={styles.formActions}>
                            <TouchableOpacity onPress={() => setShowAddForm(false)} style={styles.cancelButton}>
                                <Text style={styles.cancelText}>Anulează</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.submitButton, submitting && { opacity: 0.7 }]}
                                onPress={handleAddLog}
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <ActivityIndicator color={colors.white} size="small" />
                                ) : (
                                    <Text style={styles.submitText}>Adaugă</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Logs List */}
                {logs.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Wrench size={40} color={colors.slate[300]} strokeWidth={1} />
                        <Text style={styles.emptyText}>Niciun jurnal de întreținere</Text>
                        <Text style={styles.emptySubtext}>Apăsați + pentru a adăuga prima înregistrare</Text>
                    </View>
                ) : (
                    <View style={styles.logsList}>
                        {logs.map((log) => (
                            <View key={log.id} style={styles.logCard}>
                                <View style={styles.logHeader}>
                                    <View style={styles.logDate}>
                                        <Calendar size={14} color={colors.slate[400]} />
                                        <Text style={styles.logDateText}>
                                            {new Date(log.service_date).toLocaleDateString()}
                                        </Text>
                                    </View>
                                    <TouchableOpacity onPress={() => handleDeleteLog(log.id)}>
                                        <Trash2 size={16} color={colors.red[400]} />
                                    </TouchableOpacity>
                                </View>
                                <Text style={styles.logDescription}>{log.description}</Text>
                                <View style={styles.logMeta}>
                                    {log.cost > 0 && (
                                        <View style={styles.logMetaItem}>
                                            <DollarSign size={12} color={colors.green[500]} />
                                            <Text style={styles.logMetaText}>{log.cost.toFixed(2)}</Text>
                                        </View>
                                    )}
                                    {log.odometer && (
                                        <View style={styles.logMetaItem}>
                                            <Gauge size={12} color={colors.blue[500]} />
                                            <Text style={styles.logMetaText}>{log.odometer} km</Text>
                                        </View>
                                    )}
                                </View>
                                {log.notes && (
                                    <View style={styles.logNotes}>
                                        <FileText size={12} color={colors.slate[400]} />
                                        <Text style={styles.logNotesText}>{log.notes}</Text>
                                    </View>
                                )}
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.slate[50] },
    content: { padding: spacing.lg, paddingBottom: spacing['4xl'] },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        marginBottom: spacing.xl,
    },
    backButton: { padding: spacing.sm },
    headerTitle: { fontSize: fontSize['2xl'], fontWeight: '800', color: colors.slate[900] },
    headerSubtitle: { fontSize: fontSize.sm, color: colors.slate[500], marginTop: 2 },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.blue[600],
        justifyContent: 'center',
        alignItems: 'center',
        ...shadow.blue,
    },
    summaryCard: {
        flexDirection: 'row',
        backgroundColor: colors.white,
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        borderWidth: 1,
        borderColor: colors.slate[100],
        marginBottom: spacing.lg,
        ...shadow.sm,
    },
    chartCard: {
        backgroundColor: colors.white,
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        borderWidth: 1,
        borderColor: colors.slate[100],
        marginBottom: spacing.xl,
        ...shadow.sm,
    },
    chartTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.slate[900], marginBottom: spacing.md },
    summaryItem: { flex: 1, alignItems: 'center', gap: spacing.xs },
    summaryDivider: { width: 1, backgroundColor: colors.slate[100] },
    summaryValue: { fontSize: fontSize['2xl'], fontWeight: '800', color: colors.slate[900] },
    summaryLabel: { fontSize: fontSize.xs, color: colors.slate[500], fontWeight: '600' },
    formCard: {
        backgroundColor: colors.white,
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        borderWidth: 1,
        borderColor: colors.blue[100],
        marginBottom: spacing.xl,
        ...shadow.sm,
    },
    formTitle: { fontSize: fontSize.lg, fontWeight: '800', color: colors.slate[900], marginBottom: spacing.lg },
    inputGroup: { marginBottom: spacing.md },
    label: { fontSize: fontSize.sm, fontWeight: '600', color: colors.slate[700], marginBottom: spacing.xs },
    fieldInput: {
        backgroundColor: colors.slate[50],
        borderWidth: 1,
        borderColor: colors.slate[200],
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.lg,
        paddingVertical: Platform.OS === 'ios' ? spacing.md : spacing.sm,
        fontSize: fontSize.md,
        color: colors.slate[900],
    },
    row: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
    formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.md, marginTop: spacing.md },
    cancelButton: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: borderRadius.lg },
    cancelText: { color: colors.slate[500], fontWeight: '600' },
    submitButton: {
        backgroundColor: colors.blue[600],
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        ...shadow.blue,
    },
    submitText: { color: colors.white, fontWeight: '700' },
    emptyState: { alignItems: 'center', paddingVertical: spacing['4xl'] * 2, gap: spacing.sm },
    emptyText: { fontSize: fontSize.lg, fontWeight: '700', color: colors.slate[400] },
    emptySubtext: { fontSize: fontSize.sm, color: colors.slate[400] },
    logsList: { gap: spacing.md },
    logCard: {
        backgroundColor: colors.white,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.slate[100],
        ...shadow.sm,
    },
    logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
    logDate: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    logDateText: { fontSize: fontSize.xs, color: colors.slate[400], fontWeight: '600' },
    logDescription: { fontSize: fontSize.md, fontWeight: '600', color: colors.slate[900], marginBottom: spacing.sm },
    logMeta: { flexDirection: 'row', gap: spacing.lg },
    logMetaItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    logMetaText: { fontSize: fontSize.sm, color: colors.slate[600], fontWeight: '500' },
    logNotes: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.xs,
        marginTop: spacing.sm,
        paddingTop: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: colors.slate[100],
    },
    logNotesText: { fontSize: fontSize.sm, color: colors.slate[500], flex: 1 },
});
