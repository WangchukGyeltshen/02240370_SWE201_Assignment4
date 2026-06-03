import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import type { Order, OrderStatus } from '../types/order';
import {
  cancelScheduledNotificationAsync,
  scheduleOrderReminderAsync,
} from '../services/notifications/notificationService';

export type OrderInput = {
  title: string;
  eta: string;
  remindAt?: Date;
  notificationsEnabled: boolean;
};

type OrdersContextValue = {
  orders: Order[];
  isScheduling: boolean;
  lastError?: string;
  clearError: () => void;
  addOrder: (input: OrderInput) => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  updateOrderReminder: (orderId: string, remindAt?: Date) => Promise<void>;
  toggleOrderNotifications: (orderId: string, enabled: boolean) => Promise<void>;
  cancelOrderReminder: (orderId: string) => Promise<void>;
  upsertOrderFromNotification: (params: {
    orderId: string;
    title?: string;
    status?: OrderStatus;
  }) => void;
};

const OrdersContext = createContext<OrdersContextValue | undefined>(undefined);

const initialOrders: Order[] = [
  {
    id: 'order-1',
    title: 'Green Bowl Lunch',
    status: 'Preparing',
    eta: 'Today, 5:30 PM',
    notificationsEnabled: true,
  },
  {
    id: 'order-2',
    title: 'Office Supplies Delivery',
    status: 'Out for delivery',
    eta: 'Tomorrow, 10:00 AM',
    notificationsEnabled: false,
  },
];

function createOrderId() {
  return `order-${Date.now()}`;
}

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [isScheduling, setIsScheduling] = useState(false);
  const [lastError, setLastError] = useState<string | undefined>();

  const clearError = () => setLastError(undefined);

  const updateOrder = (orderId: string, updater: (order: Order) => Order) => {
    setOrders((prev) => prev.map((order) => (order.id === orderId ? updater(order) : order)));
  };

  const addOrder = async (input: OrderInput) => {
    setIsScheduling(true);
    clearError();

    try {
      const orderId = createOrderId();
      const order: Order = {
        id: orderId,
        title: input.title,
        status: 'Preparing',
        eta: input.eta,
        notificationsEnabled: input.notificationsEnabled,
        remindAt: input.remindAt ? input.remindAt.toISOString() : undefined,
      };

      let localNotificationId: string | undefined;

      if (input.notificationsEnabled && input.remindAt) {
        const scheduleResult = await scheduleOrderReminderAsync(order, input.remindAt);
        if ('error' in scheduleResult) {
          setLastError(scheduleResult.error);
        } else {
          localNotificationId = scheduleResult.id;
        }
      }

      setOrders((prev) => [{ ...order, localNotificationId }, ...prev]);
    } finally {
      setIsScheduling(false);
    }
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    updateOrder(orderId, (order) => ({ ...order, status }));
  };

  const toggleOrderNotifications = async (orderId: string, enabled: boolean) => {
    setIsScheduling(true);
    clearError();

    try {
      let newNotificationId: string | undefined;

      const targetOrder = orders.find((order) => order.id === orderId);
      if (!targetOrder) {
        return;
      }

      if (!enabled && targetOrder.localNotificationId) {
        await cancelScheduledNotificationAsync(targetOrder.localNotificationId);
      }

      if (enabled && !targetOrder.remindAt) {
        setLastError('Set a reminder time before enabling notifications.');
        return;
      }

      if (enabled && targetOrder.remindAt) {
        const scheduleResult = await scheduleOrderReminderAsync(
          targetOrder,
          new Date(targetOrder.remindAt)
        );
        if ('error' in scheduleResult) {
          setLastError(scheduleResult.error);
        } else {
          newNotificationId = scheduleResult.id;
        }
      }

      updateOrder(orderId, (order) => ({
        ...order,
        notificationsEnabled: enabled,
        localNotificationId: enabled ? newNotificationId : undefined,
      }));
    } finally {
      setIsScheduling(false);
    }
  };

  const updateOrderReminder = async (orderId: string, remindAt?: Date) => {
    setIsScheduling(true);
    clearError();

    try {
      const targetOrder = orders.find((order) => order.id === orderId);
      if (!targetOrder) {
        return;
      }

      if (targetOrder.localNotificationId) {
        await cancelScheduledNotificationAsync(targetOrder.localNotificationId);
      }

      let newNotificationId: string | undefined;

      if (targetOrder.notificationsEnabled && remindAt) {
        const scheduleResult = await scheduleOrderReminderAsync(targetOrder, remindAt);
        if ('error' in scheduleResult) {
          setLastError(scheduleResult.error);
        } else {
          newNotificationId = scheduleResult.id;
        }
      }

      updateOrder(orderId, (order) => ({
        ...order,
        remindAt: remindAt ? remindAt.toISOString() : undefined,
        localNotificationId: newNotificationId,
      }));
    } finally {
      setIsScheduling(false);
    }
  };

  const cancelOrderReminder = async (orderId: string) => {
    setIsScheduling(true);
    clearError();

    try {
      const targetOrder = orders.find((order) => order.id === orderId);
      if (!targetOrder?.localNotificationId) {
        return;
      }

      await cancelScheduledNotificationAsync(targetOrder.localNotificationId);
      updateOrder(orderId, (order) => ({
        ...order,
        remindAt: undefined,
        localNotificationId: undefined,
      }));
    } finally {
      setIsScheduling(false);
    }
  };

  const upsertOrderFromNotification = ({
    orderId,
    title,
    status,
  }: {
    orderId: string;
    title?: string;
    status?: OrderStatus;
  }) => {
    setOrders((prev) => {
      const existing = prev.find((order) => order.id === orderId);
      if (existing) {
        return prev.map((order) =>
          order.id === orderId
            ? { ...order, title: title ?? order.title, status: status ?? order.status }
            : order
        );
      }

      return [
        {
          id: orderId,
          title: title ?? 'Order update',
          status: status ?? 'Preparing',
          eta: 'Check the latest update in the app.',
          notificationsEnabled: true,
        },
        ...prev,
      ];
    });
  };

  const value = useMemo(
    () => ({
      orders,
      isScheduling,
      lastError,
      clearError,
      addOrder,
      updateOrderStatus,
      updateOrderReminder,
      toggleOrderNotifications,
      cancelOrderReminder,
      upsertOrderFromNotification,
    }),
    [orders, isScheduling, lastError, upsertOrderFromNotification]
  );

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders() {
  const context = useContext(OrdersContext);
  if (!context) {
    throw new Error('useOrders must be used within OrdersProvider');
  }

  return context;
}
