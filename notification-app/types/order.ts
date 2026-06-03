export type OrderStatus = 'Preparing' | 'Out for delivery' | 'Arriving soon' | 'Delivered';

export type Order = {
  id: string;
  title: string;
  status: OrderStatus;
  eta: string;
  remindAt?: string;
  notificationsEnabled: boolean;
  localNotificationId?: string;
};

export const orderStatuses: OrderStatus[] = [
  'Preparing',
  'Out for delivery',
  'Arriving soon',
  'Delivered',
];

export function isOrderStatus(value: string): value is OrderStatus {
  return orderStatuses.includes(value as OrderStatus);
}
