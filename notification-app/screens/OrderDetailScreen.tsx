import { useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';

import PrimaryButton from '../components/PrimaryButton';
import { useOrders } from '../context/OrdersContext';
import type { RootStackParamList } from '../navigation/types';
import { orderStatuses } from '../types/order';

export default function OrderDetailScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'OrderDetail'>>();
  const { orderId } = route.params;
  const { orders, updateOrderStatus, updateOrderReminder, toggleOrderNotifications } =
    useOrders();
  const order = orders.find((item) => item.id === orderId);
  const [showPicker, setShowPicker] = useState(false);

  if (!order) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>Order not found</Text>
        <Text style={styles.emptyText}>Wait for an update or create a new order.</Text>
      </View>
    );
  }

  const reminderDate = order.remindAt ? new Date(order.remindAt) : undefined;

  const handlePickerChange = (_event: unknown, date?: Date) => {
    setShowPicker(Platform.OS === 'ios');
    if (date) {
      updateOrderReminder(order.id, date);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{order.title}</Text>
        <Text style={styles.subtitle}>Status: {order.status}</Text>
        <Text style={styles.meta}>ETA: {order.eta}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Update status</Text>
        <View style={styles.statusRow}>
          {orderStatuses.map((status) => (
            <PrimaryButton
              key={status}
              label={status}
              onPress={() => updateOrderStatus(order.id, status)}
              variant={order.status === status ? 'primary' : 'ghost'}
            />
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Reminder</Text>
        <Text style={styles.meta}>
          {reminderDate
            ? `Scheduled for ${reminderDate.toLocaleString()}`
            : 'No reminder scheduled.'}
        </Text>
        <View style={styles.buttonRow}>
          <PrimaryButton label="Set reminder" onPress={() => setShowPicker(true)} />
          <PrimaryButton
            label={order.notificationsEnabled ? 'Disable reminders' : 'Enable reminders'}
            onPress={() => toggleOrderNotifications(order.id, !order.notificationsEnabled)}
            variant="ghost"
          />
        </View>
      </View>

      {showPicker && (
        <DateTimePicker
          mode="datetime"
          value={reminderDate ?? new Date()}
          onChange={handlePickerChange}
          minimumDate={new Date()}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 14,
    backgroundColor: '#f1f5f9',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 15,
    color: '#475569',
  },
  meta: {
    fontSize: 13,
    color: '#64748b',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  statusRow: {
    gap: 10,
  },
  buttonRow: {
    gap: 10,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
});
