import { useEffect, useRef } from 'react';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { savePushToken, getPushToken } from '../services/storage';
import { subscribeNotifications } from '../services/api';
import { UserLocation } from '../types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function useNotifications(location: UserLocation | null) {
  const notificationListener = useRef<any>(null);

  useEffect(() => {
    registerForPushNotifications(location);

    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Bildirim alındı:', notification);
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
    };
  }, [location?.province, location?.district]);

  return null;
}

async function registerForPushNotifications(location: UserLocation | null) {
  if (!Device.isDevice) {
    console.log('Push bildirimler sadece fiziksel cihazda çalışır');
    return;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push bildirim izni verilmedi');
    return;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('outages', {
      name: 'Kesinti Bildirimleri',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenData.data;

    await savePushToken(token);

    if (location) {
      await subscribeNotifications({
        expoPushToken: token,
        province: location.province,
        district: location.district,
        neighborhood: location.neighborhood,
        types: ['electricity', 'water', 'gas'],
      });
    }
  } catch (err) {
    console.error('Push token alınamadı:', err);
  }
}
