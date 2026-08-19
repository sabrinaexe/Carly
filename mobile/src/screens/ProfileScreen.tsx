import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    StatusBar,
    ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { User, Mail, Save, LogOut } from 'lucide-react-native';
import { colors, spacing, borderRadius, fontSize, shadow } from '../theme';

export default function ProfileScreen() {
    const { user, signOut } = useAuth();
    const [loading, setLoading] = useState(false);
    const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
    const insets = useSafeAreaInsets();

    async function updateProfile() {
        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                data: { full_name: fullName },
            });
            if (error) throw error;
        } catch (error) {
            console.error('Error updating profile:', error);
        } finally {
            setLoading(false);
        }
    }


    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingBottom: spacing['4xl'] + insets.bottom }]}>
                <StatusBar barStyle="light-content" backgroundColor={colors.slate[50]} />
                <Text style={styles.title}>Profilul meu</Text>
                <Text style={styles.subtitle}>Gestionează setările și preferințele contului</Text>

                <View style={styles.card}>
                    {/* Avatar */}
                    <View style={styles.avatarSection}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {fullName ? fullName[0].toUpperCase() : user?.email?.[0].toUpperCase()}
                            </Text>
                        </View>
                        <View>
                            <Text style={styles.displayName}>{fullName || 'Utilizator'}</Text>
                            <Text style={styles.email}>{user?.email}</Text>
                        </View>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Nume complet</Text>
                            <View style={styles.inputContainer}>
                                <User size={18} color={colors.slate[400]} />
                                <TextInput
                                    style={styles.input}
                                    value={fullName}
                                    onChangeText={setFullName}
                                    placeholder="Introduți numele complet"
                                    placeholderTextColor={colors.slate[400]}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Adresă de email</Text>
                            <View style={[styles.inputContainer, styles.inputDisabled]}>
                                <Mail size={18} color={colors.slate[400]} />
                                <TextInput
                                    style={[styles.input, { color: colors.slate[400] }]}
                                    value={user?.email || ''}
                                    editable={false}
                                />
                            </View>
                        </View>
                    </View>

                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[styles.saveButton, loading && { opacity: 0.7 }]}
                            onPress={updateProfile}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator color={colors.white} />
                            ) : (
                                <>
                                    <Save size={18} color={colors.white} />
                                    <Text style={styles.saveText}>Salvează modificările</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
                            <LogOut size={18} color={colors.red[500]} />
                            <Text style={styles.signOutText}>Ieșire din cont</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.slate[50] },
    content: { padding: spacing.lg },
    title: {
        fontSize: fontSize['3xl'],
        fontWeight: '800',
        color: colors.slate[900],
    },
    subtitle: {
        fontSize: fontSize.md,
        color: colors.slate[500],
        marginTop: spacing.xs,
        marginBottom: spacing['2xl'],
    },
    card: {
        backgroundColor: colors.white,
        borderRadius: borderRadius['2xl'],
        borderWidth: 1,
        borderColor: colors.slate[100],
        ...shadow.sm,
        overflow: 'hidden',
    },
    avatarSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.lg,
        padding: spacing['2xl'],
        backgroundColor: colors.slate[50],
        borderBottomWidth: 1,
        borderBottomColor: colors.slate[100],
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: colors.blue[100],
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: fontSize['2xl'],
        fontWeight: '800',
        color: colors.blue[600],
    },
    displayName: {
        fontSize: fontSize.xl,
        fontWeight: '800',
        color: colors.slate[900],
    },
    email: {
        fontSize: fontSize.sm,
        color: colors.slate[500],
        marginTop: 2,
    },
    form: {
        padding: spacing['2xl'],
        gap: spacing.xl,
    },
    inputGroup: { gap: spacing.sm },
    label: {
        fontSize: fontSize.sm,
        fontWeight: '600',
        color: colors.slate[700],
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.slate[50],
        borderWidth: 1,
        borderColor: colors.slate[200],
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.lg,
        gap: spacing.sm,
    },
    inputDisabled: {
        backgroundColor: colors.slate[100],
        opacity: 0.7,
    },
    input: {
        flex: 1,
        paddingVertical: spacing.md,
        fontSize: fontSize.md,
        color: colors.slate[900],
    },
    actions: {
        padding: spacing['2xl'],
        gap: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.slate[100],
    },
    signOutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        width: '100%',
    },
    signOutText: {
        color: colors.red[500],
        fontSize: fontSize.md,
        fontWeight: '600',
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        backgroundColor: colors.blue[600],
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        width: '100%',
        ...shadow.blue,
    },
    saveText: {
        color: colors.white,
        fontSize: fontSize.md,
        fontWeight: '700',
    },
});
