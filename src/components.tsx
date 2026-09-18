import React, { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from './theme';

export function Card({ children }: PropsWithChildren) {
  return <View style={styles.card}>{children}</View>;
}

export function SectionTitle({ children }: PropsWithChildren) {
  return <Text style={styles.section}>{children}</Text>;
}

export function Button({
  label,
  onPress,
  secondary = false,
  destructive = false,
  disabled = false,
  accessibilityLabel,
  testID,
}: {
  label: string;
  onPress?: () => void;
  secondary?: boolean;
  destructive?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  testID?: string;
}) {
  const handlePress = () => {
    if (!disabled && onPress) {
      onPress();
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={handlePress}
      testID={testID}
      android_ripple={{ color: secondary ? 'rgba(0,127,134,0.12)' : 'rgba(255,255,255,0.2)' }}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondary,
        destructive && styles.destructive,
        disabled && styles.disabled,
        pressed && !disabled && styles.buttonPressed,
      ]}
    >
      <Text style={[styles.buttonText, secondary && styles.secondaryText, destructive && styles.destructiveText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.line,
  },
  section: {
    color: colors.navy,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 12,
  },
  button: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: colors.teal,
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  secondary: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.teal,
  },
  destructive: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.coral,
  },
  disabled: {
    opacity: 0.5,
  },
  buttonPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.995 }],
  },
  buttonText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 16,
  },
  secondaryText: {
    color: colors.teal,
  },
  destructiveText: {
    color: colors.coral,
  },
});
