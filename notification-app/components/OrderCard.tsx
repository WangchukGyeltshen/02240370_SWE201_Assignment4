import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import type { Order } from '../types/order';

type OrderCardProps = {
  order: Order;
  onPress: () => void;
  onToggleNotifications: (value: boolean) => void;
};

function formatReminder(remindAt?: string) {
  if (!remindAt) {
    return 'No reminder scheduled';
  }

  const date = new Date(remindAt);
  if (Number.isNaN(date.getTime())) {
    return 'Reminder time invalid';
  }

  return `Reminder: ${date.toLocaleString()}`;
}

export default function OrderCard({ order, onPress, onToggleNotifications }: OrderCardProps) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.title}>{order.title}</Text>
          <Text style={styles.subtitle}>{order.status}</Text>
        </View>
        <Switch
          value={order.notificationsEnabled}
          onValueChange={onToggleNotifications}
        />
      </View>
      <Text style={styles.meta}>{order.eta}</Text>
      <Text style={styles.meta}>{formatReminder(order.remindAt)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#0f172a',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 14,
    color: '#475569',
  },
  meta: {
    fontSize: 13,
    color: '#64748b',
  },
});
