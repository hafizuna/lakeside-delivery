import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '../../shared/theme';
// import { HomeIcon, OrdersIcon, ProfileIcon, WalletIcon } from '../../shared/components/CustomIcons';

export type TabName = 'Home' | 'Orders' | 'Earnings' | 'Account';

interface BottomNavigationProps {
  activeTab: TabName;
  onTabPress: (tab: TabName) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabPress,
}) => {
  const tabs: { name: TabName; label: string; icon: string }[] = [
    { name: 'Home', label: 'Home', icon: '🏠' },
    { name: 'Orders', label: 'Orders', icon: '📦' },
    { name: 'Earnings', label: 'Earnings', icon: '💰' },
    { name: 'Account', label: 'Account', icon: '👤' },
  ];

  const getIcon = (tabName: TabName, isActive: boolean) => {
    // Using emoji icons for now - replace with custom icons later
    const iconMap = {
      'Home': '🏠',
      'Orders': '📦',
      'Earnings': '💰',
      'Account': '👤',
    };
    
    return (
      <Text style={{ fontSize: 24 }}>
        {iconMap[tabName] || '🏠'}
      </Text>
    );
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
    backgroundColor: '#ffffff',
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
    shadowColor: '#000',
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
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  labelActive: {
    color: Colors.primaryColor,
    fontWeight: '600',
  },
  tabActive: {
    transform: [{ scale: 1.05 }],
  },
  iconContainerActive: {
    backgroundColor: Colors.primaryColor,
    borderRadius: 22,
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