import { Pressable, StyleSheet, Text } from 'react-native';

type ButtonVariant = 'primary' | 'ghost' | 'danger';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: ButtonVariant;
};

const variantStyles: Record<ButtonVariant, { backgroundColor: string; textColor: string }> = {
  primary: { backgroundColor: '#0f172a', textColor: '#f8fafc' },
  ghost: { backgroundColor: '#e2e8f0', textColor: '#0f172a' },
  danger: { backgroundColor: '#dc2626', textColor: '#f8fafc' },
};

export default function PrimaryButton({
  label,
  onPress,
  disabled,
  variant = 'primary',
}: PrimaryButtonProps) {
  const variantStyle = variantStyles[variant];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: variantStyle.backgroundColor },
        pressed && styles.buttonPressed,
        disabled && styles.buttonDisabled,
      ]}
      disabled={disabled}
    >
      <Text style={[styles.buttonText, { color: variantStyle.textColor }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
