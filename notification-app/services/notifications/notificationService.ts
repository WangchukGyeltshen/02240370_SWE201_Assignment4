import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { Order } from '../../types/order';

const ANDROID_CHANNEL_ID = 'order-updates';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function configureNotificationChannelAsync() {
  if (Platform.OS !== 'android') {
    await Notifications.setNotificationCategoryAsync('order-update', [
      {
        identifier: 'view-order',
        buttonTitle: 'View Order',
        options: {
          opensAppToForeground: true,
        },
      },
    ]);
    return;
  }

  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Order updates',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#0ea5e9',
  });

  await Notifications.setNotificationCategoryAsync('order-update', [
    {
      identifier: 'view-order',
      buttonTitle: 'View Order',
      options: {
        opensAppToForeground: true,
      },
    },
  ]);
}

export async function getPermissionStatusAsync() {
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

export async function requestNotificationPermissionsAsync() {
  const { status } = await Notifications.requestPermissionsAsync();
  return status;
}

export type PushRegistrationResult = {
  status: Notifications.PermissionStatus;
  token?: string;
  error?: string;
};

export async function registerForPushNotificationsAsync(): Promise<PushRegistrationResult> {
  if (!Device.isDevice) {
    return {
      status: 'denied',
      error: 'Push notifications require a physical device.',
    };
  }

  const permission = await Notifications.getPermissionsAsync();
  let finalStatus = permission.status;

  if (finalStatus !== 'granted') {
    const request = await Notifications.requestPermissionsAsync();
    finalStatus = request.status;
  }

  if (finalStatus !== 'granted') {
    return {
      status: finalStatus,
      error: 'Permission was not granted for notifications.',
    };
  }

  const projectId =
    Constants.easConfig?.projectId ??
    (Constants.expoConfig?.extra?.projectId as string | undefined) ??
    process.env.EXPO_PUBLIC_PROJECT_ID;

  const tokenResponse = projectId
    ? await Notifications.getExpoPushTokenAsync({ projectId })
    : await Notifications.getExpoPushTokenAsync();

  return { status: finalStatus, token: tokenResponse.data };
}

export async function scheduleOrderReminderAsync(order: Order, remindAt: Date) {
  if (remindAt.getTime() <= Date.now()) {
    return { error: 'Reminder time must be in the future.' };
  }

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Order reminder',
      body: `Check order "${order.title}" before it arrives.`,
      sound: 'default',
      categoryIdentifier: 'order-update',
      data: {
        orderId: order.id,
      },
    },
    trigger: {
      date: remindAt,
      channelId: ANDROID_CHANNEL_ID,
    },
  });

  return { id };
}

export async function cancelScheduledNotificationAsync(id: string) {
  await Notifications.cancelScheduledNotificationAsync(id);
}

export function addNotificationListeners(
  onReceive: (notification: Notifications.Notification) => void,
  onResponse: (response: Notifications.NotificationResponse) => void
) {
  const receivedSub = Notifications.addNotificationReceivedListener(onReceive);
  const responseSub = Notifications.addNotificationResponseReceivedListener(onResponse);

  return () => {
    receivedSub.remove();
    responseSub.remove();
  };
}
