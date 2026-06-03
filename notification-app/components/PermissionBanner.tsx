import { StyleSheet, Text, View } from 'react-native';
import type { PermissionStatus } from 'expo-notifications';

import PrimaryButton from './PrimaryButton';

type PermissionBannerProps = {
  status: PermissionStatus;
  onRequest: () => void;
  isRequesting?: boolean;
};

const statusCopy: Partial<Record<PermissionStatus, string>> = {
  granted: 'Notifications are enabled for this device.',
  denied: 'Notifications are blocked. Enable them in system settings.',
  undetermined: 'Notifications are not yet enabled for this device.',
};

export default function PermissionBanner({
  status,
  onRequest,
  isRequesting,
}: PermissionBannerProps) {
  const message = statusCopy[status] ?? statusCopy.undetermined ?? '';

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>{message}</Text>
      {status !== 'granted' && (
        <PrimaryButton
          label={isRequesting ? 'Requesting...' : 'Enable Notifications'}
          onPress={onRequest}
          disabled={isRequesting}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#e2e8f0',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    gap: 10,
  },
  text: {
    color: '#0f172a',
    fontSize: 14,
  },
});
