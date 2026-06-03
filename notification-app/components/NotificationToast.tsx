import { StyleSheet, Text, View } from 'react-native';

type NotificationToastProps = {
  title?: string;
  body?: string;
  visible: boolean;
};

export default function NotificationToast({
  title,
  body,
  visible,
}: NotificationToastProps) {
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.toast}>
      <Text style={styles.title}>{title ?? 'New notification'}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 52,
    left: 16,
    right: 16,
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#0f172a',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  title: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  body: {
    color: '#e2e8f0',
    fontSize: 13,
  },
});
