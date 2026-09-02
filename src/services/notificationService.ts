import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { SettingsService } from './settingsService';
import { useTranslation } from 'react-i18next';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export const requestNotificationPermissions = async (): Promise<boolean> => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if(existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if(finalStatus !== 'granted')
        return false;

    if(Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#00E676',
        });
    }

    return true;
};

export const scheduleDailyReminder = async (lastActivityDate?: Date | null) => {
    const {t, i18n} = useTranslation();
    const isEnabled = await SettingsService.getNotificationEnabled();
    await Notifications.cancelAllScheduledNotificationsAsync();

    if(!isEnabled) return;

    const hasPermission = await requestNotificationPermissions();
    if(!hasPermission) return;

    const { hour, minute } = await SettingsService.getNotificationTime();

    const today = new Date();
    const hasTrainedToday = lastActivityDate ? (
        new Date(lastActivityDate).getDate() === today.getDate() &&
        new Date(lastActivityDate).getMonth() === today.getMonth() && 
        new Date(lastActivityDate).getFullYear() === today.getFullYear()
    ) : false;

    let targetDate = new Date();
    targetDate.setHours(hour, minute, 0, 0);

    if(targetDate.getTime() <= today.getTime() || hasTrainedToday)
        targetDate.setDate(targetDate.getDate() + 1);

    await Notifications.scheduleNotificationAsync({
        content: {
            title: t('notificationsReminderTitle'),
            body: t('notificationsReminderBody'),
            sound: true,
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: targetDate.getHours(),
            minute: targetDate.getMinutes(),
        },
    });
};

// TODO
// TRENUTNI PODJSTNIK (ZA TESTIRANJE)!
export const sendInstantNotification = async () => {
    const hasPermission = await requestNotificationPermissions();
    if(!hasPermission)
        return;

    await Notifications.scheduleNotificationAsync({
        content: {
            title: 'Test podsjetnik!',
            body: 'Notifikacije uspješno dodane!',
        },
        trigger: null,
    });
};