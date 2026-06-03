import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import type { Notification } from 'expo-notifications';
import type { NotificationResponse } from 'expo-notifications';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import NotificationToast from './components/NotificationToast';
import { OrdersProvider, useOrders } from './context/OrdersContext';
import AppNavigator from './navigation/AppNavigator';
import { navigationRef, navigate } from './navigation/RootNavigation';
import { isOrderStatus } from './types/order';
import {
  addNotificationListeners,
  configureNotificationChannelAsync,
} from './services/notifications/notificationService';

function NotificationGate({ children }: { children: ReactNode }) {
  const { upsertOrderFromNotification } = useOrders();
  const [toast, setToast] = useState<{ title?: string; body?: string } | null>(null);

  useEffect(() => {
    configureNotificationChannelAsync();

    const onReceive = (notification: Notification) => {
      setToast({
        title: notification.request.content.title ?? 'New update',
        body: notification.request.content.body ?? undefined,
      });
    };

    const onResponse = (response: NotificationResponse) => {
      const data = response.notification.request.content.data as {
        orderId?: string;
        status?: string;
      };
      if (data?.orderId) {
        const status = data.status && isOrderStatus(data.status) ? data.status : undefined;
        upsertOrderFromNotification({
          orderId: data.orderId,
          title: response.notification.request.content.title ?? undefined,
          status,
        });
        navigate('OrderDetail', { orderId: data.orderId });
      }
    };

    const removeListeners = addNotificationListeners(onReceive, onResponse);
    return () => removeListeners();
  }, [upsertOrderFromNotification]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <View style={styles.appShell}>
      {children}
      <NotificationToast
        visible={Boolean(toast)}
        title={toast?.title}
        body={toast?.body}
      />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <OrdersProvider>
        <NotificationGate>
          <NavigationContainer ref={navigationRef}>
            <AppNavigator />
          </NavigationContainer>
        </NotificationGate>
        <StatusBar style="dark" />
      </OrdersProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  appShell: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
});
