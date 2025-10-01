import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Car, FileText, Settings, HelpCircle, LogOut } from 'lucide-react-native';
import { Colors, Typography, Spacing } from '../../../shared/theme';
import { useToast } from '../../../shared/context/ToastContext';

export const AccountScreen: React.FC = () => {
  const { showInfo } = useToast();

  const menuItems = [
    { icon: User, title: 'Personal Info', onPress: () => showInfo('Coming Soon', 'Personal info management') },
    { icon: Car, title: 'Vehicle Details', onPress: () => showInfo('Coming Soon', 'Vehicle management') },
    { icon: FileText, title: 'Documents', onPress: () => showInfo('Coming Soon', 'Document verification') },
    { icon: Settings, title: 'Settings', onPress: () => showInfo('Coming Soon', 'App settings') },
    { icon: HelpCircle, title: 'Help & Support', onPress: () => showInfo('Coming Soon', 'Support center') },
    { icon: LogOut, title: 'Logout', onPress: () => showInfo('Coming Soon', 'Logout functionality') },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Account</Text>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.profileSection}>
          <View style={styles.profileImage}>
            <User size={40} color={Colors.text.white} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Driver Name</Text>
            <Text style={styles.profilePhone}>+91 98765 43210</Text>
            <View style={styles.ratingContainer}>
              <Text style={styles.rating}>⭐ 4.8</Text>
              <Text style={styles.ratingCount}>(124 reviews)</Text>
            </View>
          </View>
        </View>

        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={item.onPress}
              >
                <Icon size={24} color={Colors.text.secondary} />
                <Text style={styles.menuItemText}>{item.title}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  content: {
    flex: 1,
  },
  profileSection: {
    flexDirection: 'row',
    padding: Spacing.lg,
    backgroundColor: '#f8f9fa',
    marginBottom: Spacing.md,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryColor,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  profileName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  profilePhone: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
    marginRight: Spacing.xs,
  },
  ratingCount: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  menuContainer: {
    paddingHorizontal: Spacing.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  menuItemText: {
    flex: 1,
    marginLeft: Spacing.md,
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
  },
});