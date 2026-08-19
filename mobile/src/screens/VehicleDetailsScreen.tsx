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
    Linking,
    StatusBar,
    Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import {
    ArrowLeft,
    Save,
    Trash2,
    AlertCircle,
    AlertTriangle,
    Calendar,
    CheckCircle2,
    Wrench,
    Upload,
    FileText,
    Eye,
    X,
} from 'lucide-react-native';
import { vehicleService } from '../services/vehicleService';
import { documentService } from '../services/documentService';
import { notificationService } from '../services/notificationService';
import type { Vehicle, VehicleFormData, VehicleDocument } from '../types/vehicle';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, borderRadius, fontSize, shadow } from '../theme';
import * as DocumentPicker from 'expo-document-picker';

type RouteParams = {
    VehicleDetails: { id: string };
};

export default function VehicleDetailsScreen() {
    const route = useRoute<RouteProp<RouteParams, 'VehicleDetails'>>();
    const navigation = useNavigation<any>();
    const { user } = useAuth();
    const vehicleId = route.params.id;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    const [docs, setDocs] = useState<VehicleDocument[]>([]);
    const [uploading, setUploading] = useState<string | null>(null);
    const [datePickerField, setDatePickerField] = useState<string | null>(null);

    const [formData, setFormData] = useState<VehicleFormData>({
        type: 'car',
        make: '',
        model: '',
        year: new Date().getFullYear(),
        license_plate: '',
        vin: '',
        color: '',
        insurance_expiry: '',
        itp_expiry: '',
        rovinieta_expiry: '',
    });

    const loadVehicle = useCallback(async () => {
        try {
            const vehicles = await vehicleService.getVehicles();
            const found = vehicles.find((c) => c.id === vehicleId);
            if (found) {
                setVehicle(found);
                setFormData({
                    type: found.type,
                    make: found.make,
                    model: found.model,
                    year: found.year,
                    license_plate: found.license_plate,
                    vin: found.vin,
                    color: found.color,
                    insurance_expiry: found.insurance_expiry || '',
                    itp_expiry: found.itp_expiry || '',
                    rovinieta_expiry: found.rovinieta_expiry || '',
                    passenger_capacity: found.passenger_capacity,
                });
            } else {
                Alert.alert('Eroare', 'Vehiculul nu a fost găsit');
                navigation.goBack();
            }
        } catch (error) {
            console.error('Error loading vehicle:', error);
            Alert.alert('Eroare', 'Nu s-au putut încărca detaliile vehiculului');
        } finally {
            setLoading(false);
        }
    }, [vehicleId]);

    const loadDocs = useCallback(async () => {
        try {
            const data = await documentService.getDocuments(vehicleId);
            setDocs(data);
        } catch (error) {
            console.error('Error loading docs:', error);
        }
    }, [vehicleId]);

    useEffect(() => {
        loadVehicle();
        loadDocs();
    }, [loadVehicle, loadDocs]);

    const handleUpload = async (type: VehicleDocument['file_type']) => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/jpeg', 'image/png'],
                copyToCacheDirectory: true,
            });

            if (result.canceled) return;
            const file = result.assets[0];
            setUploading(type);
            await documentService.uploadDocument(vehicleId, file.uri, file.name, type);
            await loadDocs();
            Alert.alert('Succes', `Document ${type} încărcat`);
        } catch (error) {
            console.error('Error uploading:', error);
            Alert.alert('Eroare', 'Încărcarea a eșuat');
        } finally {
            setUploading(null);
        }
    };

    const handleViewDoc = async (path: string) => {
        try {
            const url = await documentService.getDownloadUrl(path);
            Linking.openURL(url);
        } catch (error) {
            Alert.alert('Eroare', 'Nu s-a putut deschide documentul');
        }
    };

    const handleDeleteDoc = (docId: string, path: string) => {
        Alert.alert('Șterge document', 'Ești sigur?', [
            { text: 'Anulează', style: 'cancel' },
            {
                text: 'Șterge',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await documentService.deleteDocument(docId, path);
                        setDocs(docs.filter((d) => d.id !== docId));
                    } catch (error) {
                        Alert.alert('Eroare', 'Nu s-a putut șterge documentul');
                    }
                },
            },
        ]);
    };

    const handleSave = async () => {
        if (!user || !vehicle) return;
        setSaving(true);
        try {
            await vehicleService.updateVehicle(vehicle.id, formData);
            await notificationService.scheduleNotificationsForAllVehicles();
            Alert.alert('Succes', 'Vehicul actualizat cu succes');
            navigation.goBack();
        } catch (error) {
            console.error('Error updating vehicle:', error);
            Alert.alert('Eroare', 'Nu s-a putut actualiza vehiculul');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = () => {
        Alert.alert('Șterge vehiculul', 'Ești sigur că vrei să ștergi acest vehicul?', [
            { text: 'Anulează', style: 'cancel' },
            {
                text: 'Șterge',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await vehicleService.deleteVehicle(vehicle!.id);
                        await notificationService.scheduleNotificationsForAllVehicles();
                        navigation.goBack();
                    } catch (error) {
                        Alert.alert('Eroare', 'Nu s-a putut șterge vehiculul');
                    }
                },
            },
        ]);
    };

    // Issues
    const getIssues = () => {
        const issues: { type: string; days: number; severity: 'expired' | 'urgent' | 'soon' | 'ok' }[] = [];
        const checkDate = (dateStr: string | null | undefined, type: string) => {
            if (!dateStr) return;
            const date = new Date(dateStr);
            date.setHours(0, 0, 0, 0);
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            const days = Math.ceil((date.getTime() - now.getTime()) / 86400000);
            if (days < 0) issues.push({ type, days, severity: 'expired' });
            else if (days <= 7) issues.push({ type, days, severity: 'urgent' });
            else if (days <= 30) issues.push({ type, days, severity: 'soon' });
            else issues.push({ type, days, severity: 'ok' });
        };
        checkDate(formData.insurance_expiry, 'Asigurare');
        if (formData.type !== 'scooter') {
            checkDate(formData.itp_expiry, 'ITP');
            checkDate(formData.rovinieta_expiry, 'Rovinieță');
        }
        return issues.sort((a, b) => a.days - b.days);
    };

    const getDocsForType = (type: string) => docs.filter((d) => d.file_type === type);
    const issues = getIssues();

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.blue[600]} />
            </View>
        );
    }

    const DocumentExpiryRow = ({
        label,
        type,
        dateValue,
        onDateChange,
    }: {
        label: string;
        type: VehicleDocument['file_type'];
        dateValue: string;
        onDateChange: (val: string) => void;
    }) => {
        const typeDocs = getDocsForType(type);
        return (
            <View style={styles.docRow}>
                <View style={styles.docRowHeader}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.fieldLabel}>{label}</Text>
                        <TouchableOpacity
                            style={[styles.fieldInput, { justifyContent: 'center' }]}
                            onPress={() => setDatePickerField(type)}
                        >
                            <Text style={{ color: dateValue ? colors.slate[900] : colors.slate[400] }}>
                                {dateValue ? new Date(dateValue).toLocaleDateString() : 'YYYY-MM-DD'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                        style={styles.uploadButton}
                        onPress={() => handleUpload(type)}
                        disabled={uploading === type}
                    >
                        <Upload size={16} color={colors.blue[600]} />
                        <Text style={styles.uploadButtonText}>
                            {uploading === type ? 'Se încarcă...' : 'Încărcare'}
                        </Text>
                    </TouchableOpacity>
                </View>
                {typeDocs.length > 0 && (
                    <View style={styles.docList}>
                        {typeDocs.map((doc) => (
                            <View key={doc.id} style={styles.docItem}>
                                <FileText size={14} color={colors.blue[500]} />
                                <Text style={styles.docName} numberOfLines={1}>{doc.name}</Text>
                                <Text style={styles.docDate}>{new Date(doc.created_at).toLocaleDateString()}</Text>
                                <TouchableOpacity onPress={() => handleViewDoc(doc.file_path)} style={styles.docAction}>
                                    <Eye size={14} color={colors.slate[400]} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleDeleteDoc(doc.id, doc.file_path)} style={styles.docAction}>
                                    <X size={14} color={colors.red[400]} />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                )}
            </View>
        );
    };

    const getIssueStyle = (severity: string) => {
        switch (severity) {
            case 'expired': return { bg: colors.red[50], text: colors.red[600] };
            case 'urgent': return { bg: colors.orange[50], text: colors.orange[500] };
            case 'soon': return { bg: colors.yellow[50], text: colors.yellow[500] };
            default: return { bg: colors.slate[50], text: colors.slate[500] };
        }
    };

    const getIssueIcon = (severity: string) => {
        const iconColor = getIssueStyle(severity).text;
        switch (severity) {
            case 'expired': return <AlertCircle size={18} color={iconColor} />;
            case 'urgent': return <AlertTriangle size={18} color={iconColor} />;
            case 'soon': return <Calendar size={18} color={iconColor} />;
            default: return <CheckCircle2 size={18} color={iconColor} />;
        }
    };

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
                        <Text style={styles.headerTitle}>{formData.make} {formData.model}</Text>
                        <Text style={styles.headerSubtitle}>
                            {formData.license_plate === 'N/A' ? formData.type?.toUpperCase() : formData.license_plate}
                        </Text>
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => navigation.navigate('MaintenanceLogs', { vehicleId })}
                    >
                        <Wrench size={18} color={colors.blue[600]} />
                        <Text style={styles.actionText}>Întreținere</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                        <Trash2 size={18} color={colors.red[500]} />
                        <Text style={styles.deleteText}>Șterge</Text>
                    </TouchableOpacity>
                </View>

                {/* Vehicle Details Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>Detalii vehicul</Text>
                        <View style={styles.typeBadge}>
                            <Text style={styles.typeBadgeText}>{formData.type?.toUpperCase()}</Text>
                        </View>
                    </View>
                    <View style={styles.fieldGrid}>
                        <View style={styles.fieldHalf}>
                            <Text style={styles.fieldLabel}>Marcă</Text>
                            <TextInput
                                style={styles.fieldInput}
                                value={formData.make}
                                onChangeText={(v) => setFormData({ ...formData, make: v })}
                            />
                        </View>
                        <View style={styles.fieldHalf}>
                            <Text style={styles.fieldLabel}>Model</Text>
                            <TextInput
                                style={styles.fieldInput}
                                value={formData.model}
                                onChangeText={(v) => setFormData({ ...formData, model: v })}
                            />
                        </View>
                        <View style={styles.fieldHalf}>
                            <Text style={styles.fieldLabel}>An</Text>
                            <TextInput
                                style={styles.fieldInput}
                                value={formData.year?.toString()}
                                onChangeText={(v) => setFormData({ ...formData, year: parseInt(v) || 0 })}
                                keyboardType="numeric"
                            />
                        </View>
                        {formData.type !== 'scooter' && (
                            <View style={styles.fieldHalf}>
                                <Text style={styles.fieldLabel}>Nr. de înmatriculare</Text>
                                <TextInput
                                    style={[styles.fieldInput, { textTransform: 'uppercase' }]}
                                    value={formData.license_plate || ''}
                                    onChangeText={(v) => setFormData({ ...formData, license_plate: v })}
                                    autoCapitalize="characters"
                                />
                            </View>
                        )}
                        <View style={styles.fieldHalf}>
                            <Text style={styles.fieldLabel}>VIN</Text>
                            <TextInput
                                style={styles.fieldInput}
                                value={formData.vin || ''}
                                onChangeText={(v) => setFormData({ ...formData, vin: v })}
                                autoCapitalize="characters"
                            />
                        </View>
                        <View style={styles.fieldHalf}>
                            <Text style={styles.fieldLabel}>Culoare</Text>
                            <TextInput
                                style={styles.fieldInput}
                                value={formData.color}
                                onChangeText={(v) => setFormData({ ...formData, color: v })}
                            />
                        </View>
                        {formData.type === 'bus' && (
                            <View style={styles.fieldHalf}>
                                <Text style={styles.fieldLabel}>Capacitate pasageri</Text>
                                <TextInput
                                    style={styles.fieldInput}
                                    value={formData.passenger_capacity?.toString() || ''}
                                    onChangeText={(v) =>
                                        setFormData({ ...formData, passenger_capacity: parseInt(v) || undefined })
                                    }
                                    keyboardType="numeric"
                                />
                            </View>
                        )}
                    </View>
                </View>

                {/* Document Expirations Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Expirări documente</Text>
                    <View style={{ gap: spacing.xl, marginTop: spacing.lg }}>
                        <DocumentExpiryRow
                            label="Expirare asigurare"
                            type="insurance"
                            dateValue={formData.insurance_expiry || ''}
                            onDateChange={(v) => setFormData({ ...formData, insurance_expiry: v })}
                        />
                        {formData.type !== 'scooter' && (
                            <>
                                <DocumentExpiryRow
                                    label="Expirare ITP"
                                    type="itp"
                                    dateValue={formData.itp_expiry || ''}
                                    onDateChange={(v) => setFormData({ ...formData, itp_expiry: v })}
                                />
                                <DocumentExpiryRow
                                    label="Expirare Rovinieță"
                                    type="rovinieta"
                                    dateValue={formData.rovinieta_expiry || ''}
                                    onDateChange={(v) => setFormData({ ...formData, rovinieta_expiry: v })}
                                />
                            </>
                        )}
                    </View>
                </View>

                {/* Vehicle Status Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Starea vehiculului</Text>
                    <View style={{ gap: spacing.md, marginTop: spacing.lg }}>
                        {issues.length === 0 ? (
                            <View style={[styles.issueItem, { backgroundColor: colors.green[50] }]}>
                                <CheckCircle2 size={18} color={colors.green[700]} />
                                <Text style={[styles.issueText, { color: colors.green[700] }]}>Toate documentele valide</Text>
                            </View>
                        ) : (
                            issues.map((issue, i) => {
                                const style = getIssueStyle(issue.severity);
                                return (
                                    <View key={i} style={[styles.issueItem, { backgroundColor: style.bg }]}>
                                        {getIssueIcon(issue.severity)}
                                        <View>
                                            <Text style={[styles.issueTitle, { color: style.text }]}>{issue.type}</Text>
                                            <Text style={[styles.issueSubtitle, { color: style.text }]}>
                                                {issue.severity === 'expired'
                                                    ? `Expirat acum ${Math.abs(issue.days)} zile`
                                                    : issue.severity === 'ok'
                                                        ? 'Valid'
                                                        : `Expiră în ${issue.days} zile`}
                                            </Text>
                                        </View>
                                    </View>
                                );
                            })
                        )}
                    </View>
                </View>

                {/* Save Button */}
                <TouchableOpacity
                    style={[styles.saveButton, saving && { opacity: 0.7 }]}
                    onPress={handleSave}
                    disabled={saving}
                    activeOpacity={0.8}
                >
                    {saving ? (
                        <ActivityIndicator color={colors.white} />
                    ) : (
                        <>
                            <Save size={20} color={colors.white} />
                            <Text style={styles.saveButtonText}>Salvează modificările</Text>
                        </>
                    )}
                </TouchableOpacity>

                {/* Date Picker Modal */}
                {datePickerField && (
                    Platform.OS === 'ios' ? (
                        <Modal visible={true} transparent={true} animationType="slide">
                            <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                                <View style={{ backgroundColor: colors.white, paddingBottom: 40 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.slate[100] }}>
                                        <TouchableOpacity onPress={() => setDatePickerField(null)}>
                                            <Text style={{ color: colors.blue[600], fontWeight: '700', fontSize: fontSize.md }}>Gata</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <DateTimePicker
                                        value={
                                            (datePickerField === 'insurance' && formData.insurance_expiry) ? new Date(formData.insurance_expiry) :
                                                (datePickerField === 'itp' && formData.itp_expiry) ? new Date(formData.itp_expiry) :
                                                    (datePickerField === 'rovinieta' && formData.rovinieta_expiry) ? new Date(formData.rovinieta_expiry) :
                                                        new Date()
                                        }
                                        mode="date"
                                        display="spinner"
                                        textColor={colors.black}
                                        onChange={(event, selectedDate) => {
                                            if (selectedDate) {
                                                const isoDate = selectedDate.toISOString();
                                                if (datePickerField === 'insurance') setFormData({ ...formData, insurance_expiry: isoDate });
                                                if (datePickerField === 'itp') setFormData({ ...formData, itp_expiry: isoDate });
                                                if (datePickerField === 'rovinieta') setFormData({ ...formData, rovinieta_expiry: isoDate });
                                            }
                                        }}
                                    />
                                </View>
                            </View>
                        </Modal>
                    ) : (
                        <DateTimePicker
                            value={
                                (datePickerField === 'insurance' && formData.insurance_expiry) ? new Date(formData.insurance_expiry) :
                                    (datePickerField === 'itp' && formData.itp_expiry) ? new Date(formData.itp_expiry) :
                                        (datePickerField === 'rovinieta' && formData.rovinieta_expiry) ? new Date(formData.rovinieta_expiry) :
                                            new Date()
                            }
                            mode="date"
                            display="default"
                            onChange={(event, selectedDate) => {
                                setDatePickerField(null);
                                if (selectedDate) {
                                    const isoDate = selectedDate.toISOString();
                                    if (datePickerField === 'insurance') setFormData({ ...formData, insurance_expiry: isoDate });
                                    if (datePickerField === 'itp') setFormData({ ...formData, itp_expiry: isoDate });
                                    if (datePickerField === 'rovinieta') setFormData({ ...formData, rovinieta_expiry: isoDate });
                                }
                            }}
                        />
                    )
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
    backButton: {
        padding: spacing.sm,
        borderRadius: borderRadius.sm,
    },
    headerTitle: {
        fontSize: fontSize['2xl'],
        fontWeight: '800',
        color: colors.slate[900],
    },
    headerSubtitle: {
        fontSize: fontSize.sm,
        color: colors.slate[500],
        fontWeight: '500',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    actionRow: {
        flexDirection: 'row',
        gap: spacing.md,
        marginBottom: spacing.xl,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        backgroundColor: colors.blue[50],
        borderRadius: borderRadius.lg,
    },
    actionText: {
        color: colors.blue[600],
        fontWeight: '600',
        fontSize: fontSize.sm,
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        backgroundColor: colors.red[50],
        borderRadius: borderRadius.lg,
    },
    deleteText: {
        color: colors.red[500],
        fontWeight: '600',
        fontSize: fontSize.sm,
    },
    card: {
        backgroundColor: colors.white,
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        borderWidth: 1,
        borderColor: colors.slate[100],
        marginBottom: spacing.lg,
        ...shadow.sm,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    cardTitle: {
        fontSize: fontSize.xl,
        fontWeight: '800',
        color: colors.slate[900],
    },
    typeBadge: {
        backgroundColor: colors.slate[100],
        paddingHorizontal: spacing.sm,
        paddingVertical: 3,
        borderRadius: borderRadius.sm,
    },
    typeBadgeText: {
        fontSize: fontSize.xs,
        fontWeight: '800',
        color: colors.slate[500],
        letterSpacing: 0.5,
    },
    fieldGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.lg,
    },
    fieldHalf: {
        width: '47%',
    },
    fieldLabel: {
        fontSize: fontSize.sm,
        fontWeight: '600',
        color: colors.slate[700],
        marginBottom: spacing.sm,
    },
    fieldInput: {
        backgroundColor: colors.slate[50],
        borderWidth: 1,
        borderColor: colors.slate[200],
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.lg,
        height: 52,
        paddingVertical: Platform.OS === 'ios' ? spacing.md : spacing.sm,
        fontSize: fontSize.md,
        color: colors.slate[900],
    },
    docRow: { gap: spacing.md },
    docRowHeader: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: spacing.md,
    },
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        backgroundColor: colors.blue[50],
        borderRadius: borderRadius.lg,
        marginBottom: 1,
    },
    uploadButtonText: {
        color: colors.blue[600],
        fontSize: fontSize.sm,
        fontWeight: '600',
    },
    docList: { gap: spacing.sm, paddingLeft: spacing.xs },
    docItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        padding: spacing.sm,
        backgroundColor: colors.slate[50],
        borderRadius: borderRadius.sm,
    },
    docName: {
        flex: 1,
        fontSize: fontSize.sm,
        color: colors.slate[700],
    },
    docDate: {
        fontSize: fontSize.xs,
        color: colors.slate[400],
    },
    docAction: {
        padding: spacing.xs,
    },
    issueItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
    },
    issueText: {
        fontWeight: '600',
        fontSize: fontSize.md,
    },
    issueTitle: {
        fontWeight: '700',
        fontSize: fontSize.sm,
    },
    issueSubtitle: {
        fontSize: fontSize.xs,
        marginTop: 2,
        opacity: 0.9,
    },
    saveButton: {
        backgroundColor: colors.blue[600],
        borderRadius: borderRadius.lg,
        paddingVertical: spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        marginTop: spacing.md,
        ...shadow.blue,
    },
    saveButtonText: {
        color: colors.white,
        fontSize: fontSize.md,
        fontWeight: '700',
    },
});
