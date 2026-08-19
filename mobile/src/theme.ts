import React from 'react';
import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const colors = {
    // Primary
    blue: {
        50: '#EFF6FF',
        100: '#DBEAFE',
        500: '#3B82F6',
        600: '#2563EB',
        700: '#1D4ED8',
        900: '#1E3A8A',
    },
    // Neutrals (Inverted for Dark Theme)
    slate: {
        50: '#020617',
        100: '#0F172A',
        200: '#1E293B',
        300: '#334155',
        400: '#475569',
        500: '#64748B',
        600: '#94A3B8',
        700: '#CBD5E1',
        800: '#E2E8F0',
        900: '#F1F5F9',
        950: '#F8FAFC',
    },
    // Status
    red: { 50: '#FEF2F2', 100: '#FEE2E2', 400: '#F87171', 500: '#EF4444', 600: '#DC2626', 900: '#7F1D1D' },
    orange: { 50: '#FFF7ED', 100: '#FFEDD5', 400: '#FB923C', 500: '#F97316', 900: '#7C2D12' },
    yellow: { 50: '#FEFCE8', 100: '#FEF9C3', 400: '#FACC15', 500: '#EAB308', 900: '#713F12' },
    green: { 50: '#F0FDF4', 100: '#DCFCE7', 400: '#4ADE80', 500: '#22C55E', 700: '#15803D', 900: '#14532D' },
    indigo: { 100: '#E0E7FF', 400: '#818CF8', 600: '#4F46E5', 900: '#312E81' },
    white: '#0F172A', // Re-mapped to dark slate for containers
    black: '#F8FAFC', // Re-mapped to light slate for text
    transparent: 'transparent',
};

export const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 40,
};

export const borderRadius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    full: 9999,
};

export const fontSize = {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    '2xl': 22,
    '3xl': 28,
    '4xl': 34,
};

export const shadow = StyleSheet.create({
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },
    blue: {
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
});
