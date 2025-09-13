import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { Colors } from '../../../shared/theme/colors';
import { Typography } from '../../../shared/theme/typography';
import { 
  TrendingUpIcon, 
  ReceiptIcon, 
  ShoppingBagIcon, 
  DollarIcon, 
  TargetIcon, 
  CalendarIcon, 
  StoreIcon, 
  StoreOffIcon 
} from '../../../shared/components/CustomIcons';
import { apiService } from '../../../shared/services/api';
import { useRestaurantStatus } from '../../../contexts/RestaurantStatusContext';

type DashboardScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface DashboardStats {
  todayOrders: number;
  todayRevenue: number;
  weeklyOrders: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  avgOrderValue: number;
  isOpen: boolean;
}

const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<DashboardScreenNavigationProp>();
  const { isOpen } = useRestaurantStatus();
  const [stats, setStats] = useState<DashboardStats>({
    todayOrders: 24,
    todayRevenue: 1250.75,
    weeklyOrders: 168,
    weeklyRevenue: 8750.25,
    monthlyRevenue: 35420.80,
    avgOrderValue: 52.08,
    isOpen: true,
  });

  useEffect(() => {
    // Mock loading stats - in real app this would be an API call
    const loadStats = () => {
      // Simulate real-time updates
      setStats({
        todayOrders: 24,
        todayRevenue: 1250.75,
        weeklyOrders: 168,
        weeklyRevenue: 8750.25,
        monthlyRevenue: 35420.80,
        avgOrderValue: 52.08,
        isOpen: true,
      });
    };
    
    loadStats();
    loadRestaurantStatus();
  }, []);

  const loadRestaurantStatus = async () => {
    try {
      const response = await apiService.getProfile();
      if (response.success && response.data) {
        setStats(prev => ({ ...prev, isOpen: response.data.status === 'OPEN' }));
      }
    } catch (error) {
      console.error('Error loading restaurant status:', error);
    }
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    subtitle?: string;
  }> = ({ title, value, icon, subtitle }) => (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>
        {icon}
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Banner Section */}
      <View style={styles.banner}>
        <View style={styles.bannerContent}>
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>Boost Your Sales!</Text>
            <Text style={styles.bannerSubtitle}>Manage your restaurant efficiently and increase revenue with our tools</Text>
            <View
              style={[
                styles.statusDisplay,
                { backgroundColor: isOpen ? Colors.success.main : Colors.error.main }
              ]}
            >
              {isOpen ? 
                <StoreIcon size={16} color={Colors.text.inverse} /> : 
                <StoreOffIcon size={16} color={Colors.text.inverse} />
              }
              <Text style={styles.statusText}>
                {isOpen ? 'OPEN' : 'CLOSED'}
              </Text>
            </View>
          </View>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=150&h=150&fit=crop&crop=center' }}
            style={styles.bannerImage}
            resizeMode="cover"
          />
        </View>
      </View>

      {/* Weekly Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Weekly Performance</Text>
        <View style={styles.weeklyStats}>
          <StatCard
            title="Total Revenue"
            value={`$${stats.weeklyRevenue.toLocaleString()}`}
            icon={<TrendingUpIcon size={24} color={Colors.success.main} />}
            subtitle="This week"
          />
          <StatCard
            title="Weekly Orders"
            value={stats.weeklyOrders}
            icon={<ReceiptIcon size={24} color={Colors.primary.main} />}
            subtitle="+12% from last week"
          />
        </View>
      </View>

      {/* Daily Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Performance</Text>
        <View style={styles.dailyStats}>
          <StatCard
            title="Orders Today"
            value={stats.todayOrders}
            icon={<ShoppingBagIcon size={24} color={Colors.info.main} />}
          />
          <StatCard
            title="Revenue Today"
            value={`$${stats.todayRevenue.toFixed(2)}`}
            icon={<DollarIcon size={24} color={Colors.success.main} />}
          />
          <StatCard
            title="Avg Order Value"
            value={`$${stats.avgOrderValue.toFixed(2)}`}
            icon={<TargetIcon size={24} color={Colors.warning.main} />}
          />
        </View>
      </View>

      {/* Monthly Overview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Monthly Overview</Text>
        <View style={styles.monthlyCard}>
          <View style={styles.monthlyHeader}>
            <CalendarIcon size={24} color={Colors.primary.main} />
            <Text style={styles.monthlyTitle}>This Month</Text>
          </View>
          <Text style={styles.monthlyRevenue}>${stats.monthlyRevenue.toLocaleString()}</Text>
          <Text style={styles.monthlySubtitle}>Total Revenue</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  banner: {
    backgroundColor: Colors.primary.main,
    marginHorizontal: 20,
    marginTop: 60,
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: Colors.shadow.light,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  bannerContent: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
  },
  bannerText: {
    flex: 1,
    paddingRight: 16,
  },
  bannerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.inverse,
    marginBottom: 8,
  },
  bannerSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.inverse,
    opacity: 0.9,
    marginBottom: 16,
    lineHeight: 20,
  },
  bannerImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  statusDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semiBold,
    marginLeft: 6,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
    marginBottom: 16,
  },
  weeklyStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dailyStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: Colors.shadow.light,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: 4,
    textAlign: 'center',
  },
  statTitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
  monthlyCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: Colors.shadow.light,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  monthlyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  monthlyTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
    marginLeft: 8,
  },
  monthlyRevenue: {
    fontSize: Typography.fontSize.xxxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.main,
    marginBottom: 4,
  },
  monthlySubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
});

export default DashboardScreen;
