import React from 'react';
import { View, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { Menu, Bell } from 'lucide-react-native';
import { Colors, Spacing } from '../theme';
import { CartIcon } from './CustomIcons';

interface SharedHeaderProps {
  cartItemCount?: number;
  onCartPress?: () => void;
  onNotificationPress?: () => void;
  onMenuPress?: () => void;
}

export const SharedHeader: React.FC<SharedHeaderProps> = ({
  cartItemCount = 0,
  onCartPress,
  onNotificationPress,
  onMenuPress,
}) => {
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.primary} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={onMenuPress}>
          <Menu size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.cartButton} onPress={onCartPress}>
            <CartIcon size={28} color={Colors.text.primary} count={cartItemCount} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.notificationButton} onPress={onNotificationPress}>
            <Bell size={24} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.padding.screen,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.background.primary,
  },
  menuButton: {
    padding: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartButton: {
    padding: 8,
    marginRight: 8,
  },
  notificationButton: {
    padding: 8,
  },
});
