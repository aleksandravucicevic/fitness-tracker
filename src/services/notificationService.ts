import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

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

export const scheduleActivityReminder = async (enabled: boolean) => {
    await Notifications.cancelAllScheduledNotificationsAsync();

    if(!enabled)
        return;

    const hasPermission = await requestNotificationPermissions();
    if(!hasPermission)
        return;

    await Notifications.scheduleNotificationAsync({
        content: {
            title: 'Vrijeme je za trening!',
            body: 'Niste zabilježili aktivnost danas. Pokrenite trening da biste ostvarili svoje ciljeve!',
            sound: true,
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: 24 * 3600,
            repeats: true,
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