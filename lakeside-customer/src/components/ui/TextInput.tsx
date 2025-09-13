import React, { useState } from 'react';
import {
  TextInput as RNTextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps as RNTextInputProps,
} from 'react-native';
import { Colors, Layout, Typography, Spacing } from '../../shared/theme';

interface TextInputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const TextInput: React.FC<TextInputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  style,
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={[
        styles.inputContainer,
        isFocused && styles.focused,
        error && styles.error,
      ]}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <RNTextInput
          {...textInputProps}
          style={[styles.input, style]}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholderTextColor={Colors.text.placeholder}
        />
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: Layout.input.height,
    borderRadius: Layout.borderRadius.lg,
    backgroundColor: Colors.background.primary,
    borderWidth: 1.5,
    borderColor: Colors.border.light,
    ...Layout.shadow.sm,
  },
  focused: {
    borderColor: Colors.primary.main,
  },
  error: {
    borderColor: Colors.action.error,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: Spacing.padding.lg,
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
  },
  leftIcon: {
    paddingLeft: Spacing.padding.lg,
    paddingRight: Spacing.padding.sm,
  },
  rightIcon: {
    paddingRight: Spacing.padding.lg,
    paddingLeft: Spacing.padding.sm,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  errorText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.action.error,
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
  },
});
