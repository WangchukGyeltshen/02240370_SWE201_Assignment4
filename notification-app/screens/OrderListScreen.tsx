import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Device from 'expo-device';
import type { PermissionStatus } from 'expo-notifications';
import { SafeAreaView } from 'react-native-safe-area-context';

import OrderCard from '../components/OrderCard';
import OrderFormModal from '../components/OrderFormModal';
import PermissionBanner from '../components/PermissionBanner';
import PrimaryButton from '../components/PrimaryButton';
import { useOrders } from '../context/OrdersContext';
import type { RootStackParamList } from '../navigation/types';
import {
  getPermissionStatusAsync,
  registerForPushNotificationsAsync,
  requestNotificationPermissionsAsync,
} from '../services/notifications/notificationService';
import { registerPushToken, sendRemoteNotification } from '../api/backendClient';

export default function OrderListScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'Orders'>>();
  const {
    orders,
    addOrder,
    isScheduling,
    lastError,
    clearError,
    toggleOrderNotifications,
  } = useOrders();

  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('undetermined');
  const [isRequesting, setIsRequesting] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [registerState, setRegisterState] = useState<'idle' | 'loading' | 'done' | 'error'>(
    'idle'
  );
  const [registerMessage, setRegisterMessage] = useState<string | null>(null);
  const [isRemoteSending, setIsRemoteSending] = useState(false);
  const [remoteMessage, setRemoteMessage] = useState<string | null>(null);
  const [showNewOrder, setShowNewOrder] = useState(false);

  const refreshPermission = useCallback(async () => {
    const status = await getPermissionStatusAsync();
    setPermissionStatus(status);
  }, []);

  useEffect(() => {
    refreshPermission();
  }, [refreshPermission]);

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    await requestNotificationPermissionsAsync();
    await refreshPermission();
    setIsRequesting(false);
  };

  const handleRegister = async () => {
    setRegisterState('loading');
    setRegisterMessage(null);

    const result = await registerForPushNotificationsAsync();
    if (!result.token) {
      setRegisterState('error');
      setRegisterMessage(result.error ?? 'Unable to register push token.');
      return;
    }

    setPushToken(result.token);

    const deviceLabel = `${Device.deviceName ?? 'Unknown device'} (${Platform.OS})`;
    const backendResult = await registerPushToken({
      token: result.token,
      deviceLabel,
    });

    if (!backendResult.ok) {
      setRegisterState('error');
      setRegisterMessage(backendResult.error ?? 'Token registration failed.');
      return;
    }

    setRegisterState('done');
    setRegisterMessage('Push token stored on backend.');
  };

  const handleSendRemote = async () => {
    if (!pushToken) {
      setRemoteMessage('Register a push token first.');
      return;
    }

    setIsRemoteSending(true);
    setRemoteMessage(null);

    const targetOrder = orders[0];
    const title = targetOrder ? `Order ${targetOrder.id}` : 'Order update';
    const body = targetOrder
      ? `${targetOrder.title} is ${targetOrder.status}.`
      : 'Your order status changed.';

    const result = await sendRemoteNotification({
      token: pushToken,
      title,
      body,
      data: targetOrder ? { orderId: targetOrder.id } : undefined,
    });

    setIsRemoteSending(false);

    if (!result.ok) {
      setRemoteMessage(result.error ?? 'Remote notification failed.');
      return;
    }

    setRemoteMessage('Remote notification sent.');
  };

  const headerSummary = useMemo(() => {
    if (registerState === 'loading') {
      return 'Registering push token...';
    }
    if (registerState === 'done') {
      return 'Push token registered.';
    }
    if (registerState === 'error') {
      return 'Push token registration failed.';
    }
    return 'Push token not registered.';
  }, [registerState]);

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        contentContainerStyle={styles.content}
        data={orders}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Order Status Center</Text>
            <PermissionBanner
              status={permissionStatus}
              onRequest={handleRequestPermission}
              isRequesting={isRequesting}
            />

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Push registration</Text>
              <Text style={styles.sectionText}>{headerSummary}</Text>
              {pushToken ? (
                <Text style={styles.sectionNote}>
                  Token: {pushToken.slice(0, 18)}...{pushToken.slice(-8)}
                </Text>
              ) : null}
              {registerMessage ? (
                <Text style={styles.sectionNote}>{registerMessage}</Text>
              ) : null}
              <PrimaryButton
                label={registerState === 'loading' ? 'Registering...' : 'Register Push Token'}
                onPress={handleRegister}
                disabled={registerState === 'loading'}
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Remote push test</Text>
              <Text style={styles.sectionText}>
                Send a server-triggered notification to this device.
              </Text>
              {remoteMessage ? <Text style={styles.sectionNote}>{remoteMessage}</Text> : null}
              <PrimaryButton
                label={isRemoteSending ? 'Sending...' : 'Send Remote Notification'}
                onPress={handleSendRemote}
                disabled={isRemoteSending}
              />
            </View>

            <View style={styles.rowBetween}>
              <Text style={styles.sectionTitle}>Orders</Text>
              <PrimaryButton label="New order" onPress={() => setShowNewOrder(true)} />
            </View>

            {lastError ? (
              <View style={styles.warningBox}>
                <Text style={styles.warningText}>{lastError}</Text>
                <PrimaryButton label="Dismiss" onPress={clearError} variant="ghost" />
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
            onToggleNotifications={(value) => toggleOrderNotifications(item.id, value)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No orders yet</Text>
            <Text style={styles.emptyText}>Add an order to schedule reminders.</Text>
          </View>
        }
      />

      {isScheduling && (
        <View style={styles.schedulingOverlay}>
          <ActivityIndicator size="small" color="#ffffff" />
          <Text style={styles.schedulingText}>Updating reminders...</Text>
        </View>
      )}

      <OrderFormModal
        visible={showNewOrder}
        onClose={() => setShowNewOrder(false)}
        onSubmit={addOrder}
        isSubmitting={isScheduling}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  header: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 12,
    color: '#0f172a',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  sectionText: {
    fontSize: 13,
    color: '#475569',
  },
  sectionNote: {
    fontSize: 12,
    color: '#0f172a',
  },
  warningBox: {
    backgroundColor: '#fde68a',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 12,
  },
  warningText: {
    color: '#7c2d12',
    fontSize: 13,
  },
  emptyState: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  emptyText: {
    color: '#64748b',
  },
  schedulingOverlay: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    backgroundColor: '#0f172a',
    borderRadius: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  schedulingText: {
    color: '#f8fafc',
  },
});
