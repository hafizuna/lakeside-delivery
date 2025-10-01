import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing } from '../../shared/theme';

interface StatsCardProps {
  icon: string;
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
  onPress?: () => void;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  icon,
  title,
  value,
  subtitle,
  color = Colors.primaryColor,
  onPress,
}) => {
  const CardWrapper = onPress ? TouchableOpacity : View;
  
  return (
    <CardWrapper 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={[styles.value, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </CardWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: Spacing.md,
    marginHorizontal: Spacing.xs,
    marginVertical: Spacing.xs,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  icon: {
    fontSize: 20,
  },
  title: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  value: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
  },
});