import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Platform,
    Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import {
    X,
    Car,
    Bike,
    Truck,
    Zap,
    Bus,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { vehicleService } from '../services/vehicleService';
import { documentService } from '../services/documentService';
import { notificationService } from '../services/notificationService';
import type { VehicleFormData, VehicleType, Brand, Model } from '../types/vehicle';
import { colors, spacing, borderRadius, fontSize, shadow } from '../theme';

const VEHICLE_TYPES: { type: VehicleType; label: string; icon: any }[] = [
    { type: 'car', label: 'Mașină', icon: Car },
    { type: 'motorcycle', label: 'Motocicletă', icon: Bike },
    { type: 'truck', label: 'Camion', icon: Truck },
    { type: 'trailer', label: 'Remorcă', icon: Truck },
    { type: 'scooter', label: 'Scuter', icon: Zap },
    { type: 'bus', label: 'Autobuz', icon: Bus },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 50 }, (_, i) => currentYear - i);

export default function AddVehicleScreen() {
    const navigation = useNavigation<any>();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [models, setModels] = useState<Model[]>([]);
    const [selectedBrandId, setSelectedBrandId] = useState<string>('');
    const [showBrands, setShowBrands] = useState(false);
    const [showModels, setShowModels] = useState(false);
    const [datePickerField, setDatePickerField] = useState<'insurance' | 'itp' | 'rovinieta' | null>(null);

    const [formData, setFormData] = useState<VehicleFormData>({
        type: 'car',
        make: '',
        model: '',
        year: currentYear,
        license_plate: '',
        vin: '',
        color: '',
        insurance_expiry: '',
        itp_expiry: '',
        rovinieta_expiry: '',
    });

    useEffect(() => {
        loadBrands(formData.type);
    }, [formData.type]);

    useEffect(() => {
        if (selectedBrandId) {
            loadModels(selectedBrandId);
        }
    }, [selectedBrandId]);

    async function loadBrands(type: VehicleType) {
        try {
            const data = await vehicleService.getBrands(type);
            setBrands(data);
        } catch (error) {
            console.error('Error loading brands:', error);
        }
    }

    async function loadModels(brandId: string) {
        try {
            const data = await vehicleService.getModels(brandId);
            setModels(data);
        } catch (error) {
            console.error('Error loading models:', error);
        }
    }

    async function handleSubmit() {
        if (!user) return;
        if (!formData.make || !formData.model) {
            Alert.alert('Eroare', 'Te rugăm să completezi marca și modelul');
            return;
        }
        setLoading(true);
        try {
            await vehicleService.addVehicle({ ...formData, user_id: user.id });

            // Sync notifications with new data
            await notificationService.scheduleNotificationsForAllVehicles();

            Alert.alert('Succes', 'Vehicul adăugat cu succes!');
            navigation.goBack();
        } catch (error: any) {
            console.error('Error adding vehicle:', error);
            Alert.alert('Eroare', 'Nu s-a putut adăuga vehiculul: ' + (error.message || 'Eroare necunoscută'));
        } finally {
            setLoading(false);
        }
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Adaugă vehicul nou</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
                    <X size={22} color={colors.slate[500]} />
                </TouchableOpacity>
            </View>

            {/* Vehicle Type Selector */}
            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Tip de vehicul</Text>
                <View style={styles.typeGrid}>
                    {VEHICLE_TYPES.map(({ type, label, icon: Icon }) => (
                        <TouchableOpacity
                            key={type}
                            style={[
                                styles.typeButton,
                                formData.type === type && styles.typeButtonActive,
                            ]}
                            onPress={() => {
                                setFormData({ ...formData, type, make: '', model: '' });
                                setSelectedBrandId('');
                                setBrands([]);
                                setModels([]);
                            }}
                        >
                            <Icon
                                size={20}
                                color={formData.type === type ? colors.blue[600] : colors.slate[400]}
                                strokeWidth={formData.type === type ? 2 : 1.5}
                            />
                            <Text
                                style={[
                                    styles.typeLabel,
                                    formData.type === type && styles.typeLabelActive,
                                ]}
                            >
                                {label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Vehicle Info */}
            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Informații vehicul</Text>

                {/* Brand Selector */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Marcă / Producător</Text>
                    <TouchableOpacity
                        style={styles.selectorButton}
                        onPress={() => setShowBrands(!showBrands)}
                    >
                        <Text style={formData.make ? styles.selectorText : styles.selectorPlaceholder}>
                            {formData.make || 'Selectează o marcă...'}
                        </Text>
                    </TouchableOpacity>
                    {showBrands && (
                        <ScrollView style={styles.dropdown} nestedScrollEnabled>
                            {brands.length === 0 ? (
                                <Text style={styles.dropdownEmpty}>Nicio marcă găsită pentru acest tip</Text>
                            ) : (
                                brands.map((brand) => (
                                    <TouchableOpacity
                                        key={brand.id}
                                        style={styles.dropdownItem}
                                        onPress={() => {
                                            setFormData({ ...formData, make: brand.name, model: '' });
                                            setSelectedBrandId(brand.id);
                                            setShowBrands(false);
                                            setModels([]);
                                        }}
                                    >
                                        <Text style={styles.dropdownText}>{brand.name}</Text>
                                    </TouchableOpacity>
                                ))
                            )}
                        </ScrollView>
                    )}
                    {/* Fallback manual input */}
                    {!selectedBrandId && (
                        <TextInput
                            style={styles.fieldInput}
                            value={formData.make}
                            onChangeText={(v) => {
                                setFormData({ ...formData, make: v });
                                if (v === '') setSelectedBrandId('');
                            }}
                            placeholder="Sau introduceți manual"
                            placeholderTextColor={colors.slate[400]}
                        />
                    )}
                </View>

                {/* Model Selector */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Model</Text>
                    {selectedBrandId && models.length > 0 && (
                        <>
                            <TouchableOpacity
                                style={styles.selectorButton}
                                onPress={() => setShowModels(!showModels)}
                            >
                                <Text style={formData.model ? styles.selectorText : styles.selectorPlaceholder}>
                                    {formData.model || 'Selectează un model...'}
                                </Text>
                            </TouchableOpacity>
                            {showModels && (
                                <ScrollView style={styles.dropdown} nestedScrollEnabled>
                                    {models.map((model) => (
                                        <TouchableOpacity
                                            key={model.id}
                                            style={styles.dropdownItem}
                                            onPress={() => {
                                                setFormData({ ...formData, model: model.name });
                                                setShowModels(false);
                                            }}
                                        >
                                            <Text style={styles.dropdownText}>{model.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            )}
                        </>
                    )}
                    {(!selectedBrandId || !models.some(m => m.name === formData.model)) && (
                        <TextInput
                            style={styles.fieldInput}
                            value={formData.model}
                            onChangeText={(v) => setFormData({ ...formData, model: v })}
                            placeholder={selectedBrandId && models.length > 0 ? 'Sau introduceți manual' : 'Introduceți modelul'}
                            placeholderTextColor={colors.slate[400]}
                        />
                    )}
                </View>

                <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.label}>An</Text>
                        <TextInput
                            style={styles.fieldInput}
                            value={formData.year?.toString()}
                            onChangeText={(v) => setFormData({ ...formData, year: parseInt(v) || currentYear })}
                            keyboardType="numeric"
                        />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.label}>Culoare</Text>
                        <TextInput
                            style={styles.fieldInput}
                            value={formData.color}
                            onChangeText={(v) => setFormData({ ...formData, color: v })}
                            placeholder="ex: Negru"
                            placeholderTextColor={colors.slate[400]}
                        />
                    </View>
                </View>

                {formData.type !== 'scooter' && (
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Nr. de înmatriculare</Text>
                        <TextInput
                            style={[styles.fieldInput, { textTransform: 'uppercase' }]}
                            value={formData.license_plate || ''}
                            onChangeText={(v) => setFormData({ ...formData, license_plate: v })}
                            autoCapitalize="characters"
                            placeholder="ex: B 123 ABC"
                            placeholderTextColor={colors.slate[400]}
                        />
                    </View>
                )}

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>VIN</Text>
                    <TextInput
                        style={styles.fieldInput}
                        value={formData.vin || ''}
                        onChangeText={(v) => setFormData({ ...formData, vin: v })}
                        autoCapitalize="characters"
                        placeholder="Opțional"
                        placeholderTextColor={colors.slate[400]}
                    />
                </View>

                {formData.type === 'bus' && (
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Capacitate pasageri</Text>
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

            {/* Document Expirations */}
            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Expirări documente</Text>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Expirare asigurare</Text>
                    <TouchableOpacity
                        style={styles.fieldInput}
                        onPress={() => setDatePickerField('insurance')}
                    >
                        <Text style={{ color: formData.insurance_expiry ? colors.slate[900] : colors.slate[400] }}>
                            {formData.insurance_expiry ? new Date(formData.insurance_expiry).toLocaleDateString() : 'Selectează data'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {formData.type !== 'scooter' && (
                    <>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Expirare ITP</Text>
                            <TouchableOpacity
                                style={styles.fieldInput}
                                onPress={() => setDatePickerField('itp')}
                            >
                                <Text style={{ color: formData.itp_expiry ? colors.slate[900] : colors.slate[400] }}>
                                    {formData.itp_expiry ? new Date(formData.itp_expiry).toLocaleDateString() : 'Selectează data'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Expirare Rovinieță</Text>
                            <TouchableOpacity
                                style={styles.fieldInput}
                                onPress={() => setDatePickerField('rovinieta')}
                            >
                                <Text style={{ color: formData.rovinieta_expiry ? colors.slate[900] : colors.slate[400] }}>
                                    {formData.rovinieta_expiry ? new Date(formData.rovinieta_expiry).toLocaleDateString() : 'Selectează data'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}

                {datePickerField && (
                    Platform.OS === 'ios' ? (
                        <Modal visible={true} transparent={true} animationType="slide">
                            <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                                <View style={{ backgroundColor: colors.white, paddingBottom: 40 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.slate[100] }}>
                                        <TouchableOpacity onPress={() => setDatePickerField(null)}>
                                            <Text style={styles.label}>Gata</Text>
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
            </View>

            {/* Submit */}
            <TouchableOpacity
                style={[styles.submitButton, loading && { opacity: 0.7 }]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.8}
            >
                {loading ? (
                    <ActivityIndicator color={colors.white} />
                ) : (
                    <Text style={styles.submitText}>Adaugă vehicul</Text>
                )}
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.slate[50] },
    content: { padding: spacing.lg, paddingBottom: spacing['4xl'] },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    headerTitle: {
        fontSize: fontSize['2xl'],
        fontWeight: '800',
        color: colors.slate[900],
    },
    closeButton: {
        padding: spacing.sm,
        borderRadius: borderRadius.sm,
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
    sectionTitle: {
        fontSize: fontSize.xl,
        fontWeight: '800',
        color: colors.slate[900],
        marginBottom: spacing.lg,
    },
    typeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    typeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.lg,
        borderWidth: 2,
        borderColor: colors.slate[200],
        backgroundColor: colors.white,
    },
    typeButtonActive: {
        borderColor: colors.blue[600],
        backgroundColor: colors.blue[50],
    },
    typeLabel: {
        fontSize: fontSize.sm,
        fontWeight: '600',
        color: colors.slate[500],
    },
    typeLabelActive: {
        color: colors.blue[600],
    },
    inputGroup: {
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    label: {
        fontSize: fontSize.sm,
        fontWeight: '600',
        color: colors.slate[700],
    },
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
    row: {
        flexDirection: 'row',
        gap: spacing.md,
        marginBottom: spacing.lg,
    },
    selectorButton: {
        backgroundColor: colors.slate[50],
        borderWidth: 1,
        borderColor: colors.slate[200],
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
    },
    selectorText: {
        fontSize: fontSize.md,
        color: colors.slate[900],
    },
    selectorPlaceholder: {
        fontSize: fontSize.md,
        color: colors.slate[400],
    },
    dropdown: {
        maxHeight: 150,
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.slate[200],
        borderRadius: borderRadius.md,
        ...shadow.md,
    },
    dropdownItem: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.slate[100],
    },
    dropdownText: {
        fontSize: fontSize.md,
        color: colors.slate[900],
    },
    dropdownEmpty: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        color: colors.slate[400],
        fontSize: fontSize.sm,
    },
    submitButton: {
        backgroundColor: colors.blue[600],
        borderRadius: borderRadius.lg,
        paddingVertical: spacing.lg,
        alignItems: 'center',
        marginTop: spacing.md,
        ...shadow.blue,
    },
    submitText: {
        color: colors.white,
        fontSize: fontSize.lg,
        fontWeight: '700',
    },
});
