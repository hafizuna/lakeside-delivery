import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '../../shared/theme';
import { HomeIcon, OrdersIcon, ProfileIcon, CartIcon } from '../../shared/components/CustomIcons';

export type TabName = 'Home' | 'Orders' | 'Profile' | 'Cart';

interface BottomNavigationProps {
  activeTab: TabName;
  onTabPress: (tab: TabName) => void;
  cartItemCount?: number;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabPress,
  cartItemCount = 0,
}) => {
  const tabs: { name: TabName; label: string }[] = [
    { name: 'Home', label: 'Home' },
    { name: 'Orders', label: 'My Orders' },
    { name: 'Profile', label: 'Profile' },
    { name: 'Cart', label: 'Cart' },
  ];

  const getIcon = (tabName: TabName, isActive: boolean) => {
    const color = isActive ? '#FFFFFF' : Colors.text.secondary; // White for active, secondary for inactive
    const size = 24; // Optimal size for the pill background
    
    switch(tabName) {
      case 'Home': return <HomeIcon size={size} color={color} />;
      case 'Orders': return <OrdersIcon size={size} color={color} />;
      case 'Profile': return <ProfileIcon size={size} color={color} />;
      case 'Cart': return <CartIcon size={size} color={color} count={cartItemCount} />;
      default: return <HomeIcon size={size} color={color} />;
    }
  };

  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.name}
          style={[
            styles.tab,
            activeTab === tab.name && styles.tabActive,
          ]}
          onPress={() => onTabPress(tab.name)}
        >
          <View style={[
            styles.iconContainer,
            activeTab === tab.name && styles.iconContainerActive,
          ]}>
            {getIcon(tab.name, activeTab === tab.name)}
          </View>
          <Text
            style={[
              styles.label,
              activeTab === tab.name && styles.labelActive,
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.background.primary,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
    shadowColor: Colors.shadow.dark,
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 16,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 4,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: Colors.action.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: Colors.background.primary,
    fontSize: Typography.fontSize.xs,
    fontWeight: 'bold' as const,
  },
  label: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  labelActive: {
    color: Colors.primary.main,
    fontWeight: '600' as const,
  },
  tabActive: {
    transform: [{ scale: 1.05 }],
  },
  iconContainerActive: {
    backgroundColor: Colors.primary.main,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
});
