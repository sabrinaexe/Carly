import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LayoutGrid, Bell, User } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';
import { View, ActivityIndicator, Platform } from 'react-native';
import { notificationService } from '../services/notificationService';
import * as Notifications from 'expo-notifications';

// Screens
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import VehicleDetailsScreen from '../screens/VehicleDetailsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AddVehicleScreen from '../screens/AddVehicleScreen';
import MaintenanceLogsScreen from '../screens/MaintenanceLogsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
    const insets = useSafeAreaInsets();
    
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: colors.white,
                    borderTopColor: colors.slate[100],
                    borderTopWidth: 1,
                    paddingBottom: Platform.OS === 'ios' ? 24 : (insets.bottom > 0 ? insets.bottom : 8),
                    paddingTop: 8,
                    height: Platform.OS === 'ios' ? 84 : 60 + (insets.bottom > 0 ? insets.bottom : 0),
                },
                tabBarActiveTintColor: colors.blue[600],
                tabBarInactiveTintColor: colors.slate[400],
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '700',
                },
            }}
        >
            <Tab.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{
                    tabBarLabel: 'Garaj',
                    tabBarIcon: ({ color, size }) => <LayoutGrid size={size} color={color} />,
                }}
            />
            <Tab.Screen
                name="Notifications"
                component={NotificationsScreen}
                options={{
                    tabBarLabel: 'Alerte',
                    tabBarIcon: ({ color, size }) => <Bell size={size} color={color} />,
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarLabel: 'Profil',
                    tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
                }}
            />
        </Tab.Navigator>
    );
}

export default function AppNavigator() {
    const { session, loading } = useAuth();

    useEffect(() => {
        let isMounted = true;
        let notificationListener: Notifications.Subscription;

        if (session) {
            notificationService.registerForPushNotificationsAsync().then((granted) => {
                if (granted && isMounted) {
                    notificationService.scheduleNotificationsForAllVehicles();
                } else if (!granted) {
                    console.log('Push notification permissions denied by user.');
                }
            });

            // Listen for notifications while the app is active
            notificationListener = Notifications.addNotificationReceivedListener(notification => {
                console.log('Foreground notification received:', notification.request.content.title);
            });
        }

        return () => {
            isMounted = false;
            if (notificationListener) {
                notificationListener.remove();
            }
        };
    }, [session]);

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.slate[50] }}>
                <ActivityIndicator size="large" color={colors.blue[600]} />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {session ? (
                    <>
                        <Stack.Screen name="Main" component={MainTabs} />
                        <Stack.Screen
                            name="VehicleDetails"
                            component={VehicleDetailsScreen}
                            options={{ animation: 'slide_from_right' }}
                        />
                        <Stack.Screen
                            name="AddVehicle"
                            component={AddVehicleScreen}
                            options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
                        />
                        <Stack.Screen
                            name="MaintenanceLogs"
                            component={MaintenanceLogsScreen}
                            options={{ animation: 'slide_from_right' }}
                        />
                    </>
                ) : (
                    <Stack.Screen name="Login" component={LoginScreen} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
