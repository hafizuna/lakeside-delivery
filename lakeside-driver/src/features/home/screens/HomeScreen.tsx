import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, MapPin, TrendingUp } from 'lucide-react-native';
import { Colors, Typography, Spacing } from '../../../shared/theme';
import { OnlineToggle } from '../../../components/driver/OnlineToggle';
import { StatsCard } from '../../../components/driver/StatsCard';
import { useToast } from '../../../shared/context/ToastContext';
import { useAuth } from '../../auth/context/AuthContext';
import { useOrders } from '../../orders/context/OrderContext';
import { useDashboard } from '../../dashboard/context/DashboardContext';
import { ActiveOrderCard, OrderRequestModal } from '../../orders/components';
import driverService from '../../../shared/services/driverService';

export const HomeScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [serviceStatus, setServiceStatus] = useState<any>(null);
  
  const { showSuccess, showInfo, showError } = useToast();
  const { user } = useAuth();
  const {
    activeOrder,
    assignmentOffer,
    clearAssignmentOffer,
    refreshOrders,
  } = useOrders();
  
  const {
    todayStats,
    todayEarnings,
    performance,
    isLoading: isDashboardLoading,
    refreshDashboard,
    fetchAllData,
  } = useDashboard();

  // Monitor driver service status
  useEffect(() => {
    const updateServiceStatus = () => {
      setServiceStatus(driverService.getStatusSummary());
    };

    updateServiceStatus();
    const interval = setInterval(updateServiceStatus, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Show assignment offer modal
  useEffect(() => {
    if (assignmentOffer) {
      setShowOrderModal(true);
    }
  }, [assignmentOffer]);

  const handleToggleOnline = (value: boolean) => {
    if (value) {
      showSuccess('Going online...', 'Setting up driver services');
      // Service state management is handled by OnlineToggle now
    } else {
      showInfo('Going offline...', 'Stopping driver services');
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refreshOrders(),
        refreshDashboard(),
      ]);
    } catch (error) {
      console.error('Failed to refresh:', error);
      showError('Refresh failed', 'Unable to update data');
    } finally {
      setRefreshing(false);
    }
  }, [refreshOrders, refreshDashboard, showError]);

  return (
    <LinearGradient
      colors={['#f8f9fa', '#ffffff']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good {new Date().getHours() < 12 ? 'Morning' : 'Evening'} 👋</Text>
            <Text style={styles.name}>{user?.name || 'Driver'}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.notificationBtn}>
              <Bell size={24} color={Colors.text.primary} />
              <View style={styles.notificationBadge}>
                <Text style={styles.badgeText}>3</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Online Toggle */}
          <OnlineToggle 
            onToggle={handleToggleOnline} 
            showDetailedStatus={true}
          />

          {/* Quick Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statsRow}>
              <StatsCard
                icon="💰"
                title="Today's Earnings"
                value={isDashboardLoading ? '...' : `₹${todayEarnings?.totalEarnings || 0}`}
                subtitle={`${(typeof todayStats.deliveries === 'object' ? 0 : todayStats.deliveries || 0)} deliveries`}
                color={Colors.success}
              />
              <StatsCard
                icon="📦"
                title="Today's Stats"
                value={isDashboardLoading ? '...' : (typeof todayStats.deliveries === 'object' ? 0 : todayStats.deliveries || 0)}
                subtitle={`${(typeof todayStats.hoursOnline === 'object' ? 0 : todayStats.hoursOnline || 0)}h online`}
                color={Colors.primaryColor}
              />
            </View>
            <View style={styles.statsRow}>
              <StatsCard
                icon="⭐"
                title="Rating"
                value={isDashboardLoading ? '...' : performance?.rating || 0}
                subtitle={`${performance?.totalDeliveries || 0} deliveries`}
                color={Colors.warning}
              />
              <StatsCard
                icon="✅"
                title="Performance"
                value={isDashboardLoading ? '...' : `${Math.round((typeof todayStats.successRate === 'object' ? 0 : todayStats.successRate || 0))}%`}
                subtitle={`${Math.round(performance?.onTimeRate || 0)}% on-time`}
                color={Colors.action.info}
              />
            </View>
          </View>

          {/* Active Order Display */}
          {activeOrder ? (
            <View style={styles.activeOrderSection}>
              <Text style={styles.sectionTitle}>Active Delivery</Text>
              <ActiveOrderCard 
                order={activeOrder} 
                showProgress={true}
              />
            </View>
          ) : serviceStatus?.isOnline ? (
            <View style={styles.activeDeliveryCard}>
              <View style={styles.activeHeader}>
                <Text style={styles.activeTitle}>Ready for Assignments</Text>
                <View style={[
                  styles.pulsingDot, 
                  { backgroundColor: serviceStatus.canReceiveOffers ? Colors.success : Colors.warning }
                ]} />
              </View>
              <Text style={styles.activeSubtitle}>
                {serviceStatus.canReceiveOffers 
                  ? 'Waiting for assignment offers...' 
                  : serviceStatus.issues.length > 0 
                    ? `Issues: ${serviceStatus.issues.join(', ')}`
                    : 'Setting up services...'}
              </Text>
            </View>
          ) : (
            <View style={styles.activeDeliveryCard}>
              <View style={styles.activeHeader}>
                <Text style={styles.activeTitle}>Go Online to Start</Text>
                <View style={[styles.pulsingDot, { backgroundColor: Colors.text.secondary }]} />
              </View>
              <Text style={styles.activeSubtitle}>
                Toggle online to start receiving assignment offers
              </Text>
            </View>
          )}

          {/* Promotions */}
          <View style={styles.promotionCard}>
            <View style={styles.promotionIcon}>
              <TrendingUp size={24} color={Colors.primaryColor} />
            </View>
            <View style={styles.promotionContent}>
              <Text style={styles.promotionTitle}>Peak Hour Bonus</Text>
              <Text style={styles.promotionSubtitle}>
                Earn ₹50 extra on each delivery between 12-2 PM
              </Text>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionIcon}>📊</Text>
              <Text style={styles.actionText}>Earnings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionIcon}>📍</Text>
              <Text style={styles.actionText}>Hotspots</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionIcon}>📅</Text>
              <Text style={styles.actionText}>Schedule</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionIcon}>🎯</Text>
              <Text style={styles.actionText}>Goals</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
      
      {/* Order Request Modal */}
      <OrderRequestModal
        visible={showOrderModal}
        offer={assignmentOffer}
        onClose={() => {
          setShowOrderModal(false);
          clearAssignmentOffer();
        }}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.padding.screen,
    paddingVertical: Spacing.lg,
  },
  greeting: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  name: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginTop: Spacing.xs,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationBtn: {
    position: 'relative',
    padding: Spacing.sm,
  },
  notificationBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: Colors.action.error,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: Colors.text.white,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
  },
  scrollContent: {
    paddingBottom: Spacing['3xl'],
  },
  statsContainer: {
    paddingHorizontal: Spacing.sm,
    marginTop: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
  },
  activeOrderSection: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  activeDeliveryCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: Spacing.md,
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.action.success,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  activeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activeTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
  },
  activeSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  pulsingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.action.success,
  },
  promotionCard: {
    flexDirection: 'row',
    backgroundColor: Colors.primary.light + '20',
    marginHorizontal: Spacing.md,
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  promotionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  promotionContent: {
    flex: 1,
  },
  promotionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  promotionSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: Spacing.md,
    marginTop: Spacing.xl,
  },
  actionButton: {
    alignItems: 'center',
    padding: Spacing.md,
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: Spacing.xs,
  },
  actionText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
});