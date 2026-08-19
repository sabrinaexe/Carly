import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../services/supabase';
import { colors, spacing, borderRadius, fontSize, shadow } from '../theme';
import { Car, Eye, EyeOff } from 'lucide-react-native';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mode, setMode] = useState<'signin' | 'signup'>('signin');
    const [showPassword, setShowPassword] = useState(false);

    const handleAuth = async () => {
        setLoading(true);
        setError(null);
        try {
            if (mode === 'signup') {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
            <StatusBar barStyle="light-content" backgroundColor={colors.slate[50]} />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <View style={styles.card}>
                    {/* Logo */}
                    <View style={styles.logoContainer}>
                        <View style={styles.logoIcon}>
                            <Car size={28} color={colors.white} strokeWidth={2.5} />
                        </View>
                        <Text style={styles.title}>
                            {mode === 'signin' ? 'Bine ai revenit' : 'Creează cont'}
                        </Text>
                        <Text style={styles.subtitle}>Autentifică-te pentru a gestiona garajul tău</Text>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Adresă de email</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="name@example.com"
                                placeholderTextColor={colors.slate[400]}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Parolă</Text>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={[styles.input, styles.passwordInput]}
                                    placeholder="••••••••"
                                    placeholderTextColor={colors.slate[400]}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                />
                                <TouchableOpacity 
                                    style={styles.eyeIcon} 
                                    onPress={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff size={20} color={colors.slate[400]} />
                                    ) : (
                                        <Eye size={20} color={colors.slate[400]} />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {error && (
                        <View style={styles.errorBox}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleAuth}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator color={colors.white} />
                        ) : (
                            <Text style={styles.buttonText}>
                                {mode === 'signin' ? 'Autentificare' : 'Creează cont'}
                            </Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                        style={styles.toggleButton}
                    >
                        <Text style={styles.toggleText}>
                            {mode === 'signin'
                                ? 'Nu ai cont? Înregistrează-te'
                                : 'Ai deja cont? Autentifică-te'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.slate[50],
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    keyboardView: {
        width: '100%',
        alignItems: 'center',
    },
    card: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: colors.white,
        borderRadius: borderRadius['2xl'],
        padding: spacing['3xl'],
        ...shadow.lg,
        borderWidth: 1,
        borderColor: colors.slate[100],
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: spacing['3xl'],
    },
    logoIcon: {
        width: 56,
        height: 56,
        backgroundColor: colors.blue[600],
        borderRadius: borderRadius.lg,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
        ...shadow.blue,
    },
    title: {
        fontSize: fontSize['3xl'],
        fontWeight: '800',
        color: colors.slate[900],
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: fontSize.md,
        color: colors.slate[500],
        marginTop: spacing.sm,
        fontWeight: '500',
    },
    form: {
        gap: spacing.lg,
        marginBottom: spacing.xl,
    },
    inputGroup: {
        gap: spacing.sm,
    },
    label: {
        fontSize: fontSize.sm,
        fontWeight: '700',
        color: colors.slate[700],
        marginLeft: spacing.xs,
    },
    input: {
        backgroundColor: colors.slate[50],
        borderWidth: 1,
        borderColor: colors.slate[200],
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.lg,
        paddingVertical: Platform.OS === 'ios' ? spacing.lg : spacing.md,
        fontSize: fontSize.md,
        color: colors.slate[900],
        fontWeight: '500',
    },
    passwordContainer: {
        position: 'relative',
        justifyContent: 'center',
    },
    passwordInput: {
        paddingRight: 45,
    },
    eyeIcon: {
        position: 'absolute',
        right: spacing.md,
        padding: spacing.xs,
    },
    errorBox: {
        backgroundColor: colors.red[50],
        borderWidth: 1,
        borderColor: colors.red[100],
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.lg,
    },
    errorText: {
        color: colors.red[600],
        fontSize: fontSize.sm,
        fontWeight: '500',
    },
    button: {
        backgroundColor: colors.blue[600],
        borderRadius: borderRadius.lg,
        paddingVertical: spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
        ...shadow.blue,
        marginBottom: spacing.lg,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonText: {
        color: colors.white,
        fontSize: fontSize.md,
        fontWeight: '700',
    },
    toggleButton: {
        alignItems: 'center',
        paddingVertical: spacing.sm,
    },
    toggleText: {
        color: colors.blue[600],
        fontSize: fontSize.sm,
        fontWeight: '600',
    },
});
