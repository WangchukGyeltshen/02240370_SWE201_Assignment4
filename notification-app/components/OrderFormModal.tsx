import { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import PrimaryButton from './PrimaryButton';
import type { OrderInput } from '../context/OrdersContext';

const defaultReminder = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() + 30);
  return date;
};

type OrderFormModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (input: OrderInput) => void;
  isSubmitting?: boolean;
};

export default function OrderFormModal({
  visible,
  onClose,
  onSubmit,
  isSubmitting,
}: OrderFormModalProps) {
  const [title, setTitle] = useState('');
  const [eta, setEta] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [remindAt, setRemindAt] = useState<Date | undefined>(defaultReminder());
  const [showPicker, setShowPicker] = useState(false);

  const handleSave = () => {
    if (!title.trim() || !eta.trim()) {
      return;
    }

    onSubmit({
      title: title.trim(),
      eta: eta.trim(),
      notificationsEnabled,
      remindAt,
    });

    setTitle('');
    setEta('');
    setNotificationsEnabled(true);
    setRemindAt(defaultReminder());
    onClose();
  };

  const handlePickerChange = (_event: unknown, date?: Date) => {
    setShowPicker(Platform.OS === 'ios');
    if (date) {
      setRemindAt(date);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <Text style={styles.title}>New Order</Text>
          <TextInput
            placeholder="Order title"
            placeholderTextColor="#94a3b8"
            style={styles.input}
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            placeholder="ETA (e.g., Today 7:10 PM)"
            placeholderTextColor="#94a3b8"
            style={styles.input}
            value={eta}
            onChangeText={setEta}
          />

          <View style={styles.rowBetween}>
            <Text style={styles.label}>Enable reminders</Text>
            <Pressable
              onPress={() => setNotificationsEnabled((prev) => !prev)}
              style={[
                styles.toggle,
                notificationsEnabled ? styles.toggleOn : styles.toggleOff,
              ]}
            >
              <Text style={styles.toggleText}>
                {notificationsEnabled ? 'On' : 'Off'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.rowBetween}>
            <Text style={styles.label}>Reminder time</Text>
            <PrimaryButton
              label={remindAt ? remindAt.toLocaleString() : 'Select time'}
              onPress={() => setShowPicker(true)}
              variant="ghost"
            />
          </View>

          {showPicker && (
            <DateTimePicker
              mode="datetime"
              value={remindAt ?? defaultReminder()}
              onChange={handlePickerChange}
              minimumDate={new Date()}
            />
          )}

          <View style={styles.actions}>
            <PrimaryButton label="Cancel" onPress={onClose} variant="ghost" />
            <PrimaryButton
              label={isSubmitting ? 'Saving...' : 'Save Order'}
              onPress={handleSave}
              disabled={isSubmitting}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#f8fafc',
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: '#0f172a',
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    color: '#0f172a',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#0f172a',
  },
  toggle: {
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  toggleOn: {
    backgroundColor: '#0f172a',
  },
  toggleOff: {
    backgroundColor: '#cbd5f5',
  },
  toggleText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
});
