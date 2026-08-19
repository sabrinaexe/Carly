import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { vehicleService } from './vehicleService';

// Configure how notifications behave when the app is in the foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export const notificationService = {
    async registerForPushNotificationsAsync() {
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#2563EB',
            });
        }

        if (Device.isDevice) {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }
            if (finalStatus !== 'granted') {
                console.log('Failed to get push token for push notification!');
                return false;
            }
            return true;
        } else {
            console.log('Must use physical device for Push Notifications');
            return false;
        }
    },

    async scheduleNotificationsForAllVehicles() {
        // Cancel all existing to avoid duplicates when re-syncing
        await Notifications.cancelAllScheduledNotificationsAsync();

        try {
            const vehicles = await vehicleService.getVehicles();

            for (const vehicle of vehicles) {
                const checks = [
                    { type: 'Asigurare', date: vehicle.insurance_expiry },
                    { type: 'ITP', date: vehicle.itp_expiry },
                    { type: 'Rovinieta', date: vehicle.rovinieta_expiry },
                ];

                for (const check of checks) {
                    if (!check.date) continue;

                    const expiryDate = new Date(check.date);
                    expiryDate.setHours(9, 0, 0, 0); // Local 9 AM delivery

                    const now = new Date();

                    // 7 days before
                    const reminder7Days = new Date(expiryDate);
                    reminder7Days.setDate(reminder7Days.getDate() - 7);

                    if (reminder7Days > now) {
                        await Notifications.scheduleNotificationAsync({
                            content: {
                                title: `Expirare ${check.type} ⚠️`,
                                body: `${check.type} pentru ${vehicle.make} ${vehicle.model} expiră în 7 zile!`,
                                sound: true,
                            },
                            trigger: {
                                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                                seconds: Math.floor((reminder7Days.getTime() - now.getTime()) / 1000)
                            },
                        });
                    }

                    // 1 day before
                    const reminder1Day = new Date(expiryDate);
                    reminder1Day.setDate(reminder1Day.getDate() - 1);

                    if (reminder1Day > now) {
                        await Notifications.scheduleNotificationAsync({
                            content: {
                                title: `Urgent: ${check.type} expiră mâine 🚨`,
                                body: `${check.type} pentru ${vehicle.make} ${vehicle.model} expiră mâine!`,
                                sound: true,
                            },
                            trigger: {
                                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                                seconds: Math.floor((reminder1Day.getTime() - now.getTime()) / 1000)
                            },
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Failed to schedule local notifications:', error);
        }
    },
};
