import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '../../../shared/theme';
import { useDashboard } from '../../dashboard/context/DashboardContext';
import { StatsCard } from '../../../components/driver/StatsCard';

type PeriodType = 'today' | 'week' | 'month';

export const EarningsScreen: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('today');
  const [refreshing, setRefreshing] = useState(false);
  
  const {
    todayEarnings,
    weekEarnings,
    monthEarnings,
    isEarningsLoading,
    earningsError,
    fetchEarnings,
    clearEarningsError,
  } = useDashboard();
  
  // Get current period data
  const getCurrentEarnings = () => {
    switch (selectedPeriod) {
      case 'today': return todayEarnings;
      case 'week': return weekEarnings;
      case 'month': return monthEarnings;
      default: return todayEarnings;
    }
  };
  
  const currentEarnings = getCurrentEarnings();
  
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchEarnings('today'),
        fetchEarnings('week'),
        fetchEarnings('month'),
      ]);
    } catch (error) {
      console.error('Failed to refresh earnings:', error);
    } finally {
      setRefreshing(false);
    }
  };
  
  const renderPeriodButton = (period: PeriodType, label: string) => (
    <TouchableOpacity
      style={[
        styles.periodButton,
        selectedPeriod === period && styles.activePeriodButton,
      ]}
      onPress={() => setSelectedPeriod(period)}
    >
      <Text
        style={[
          styles.periodButtonText,
          selectedPeriod === period && styles.activePeriodButtonText,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Earnings</Text>
        
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {renderPeriodButton('today', 'Today')}
          {renderPeriodButton('week', 'This Week')}
          {renderPeriodButton('month', 'This Month')}
        </View>
      </View>
      
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Loading State */}
        {isEarningsLoading && !currentEarnings && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary.main} />
            <Text style={styles.loadingText}>Loading earnings data...</Text>
          </View>
        )}
        
        {/* Error State */}
        {earningsError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{earningsError}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                clearEarningsError();
                fetchEarnings(selectedPeriod);
              }}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Earnings Data */}
        {currentEarnings && (
          <>
            {/* Total Earnings Card */}
            <View style={styles.totalEarningsCard}>
              <Text style={styles.totalEarningsLabel}>Total Earnings</Text>
              <Text style={styles.totalEarningsValue}>
                ₹{typeof currentEarnings.totalEarnings === 'object' ? '0' : (currentEarnings.totalEarnings || 0)}
              </Text>
              <Text style={styles.totalEarningsSubtitle}>
                {typeof currentEarnings.totalDeliveries === 'object' ? '0' : (currentEarnings.totalDeliveries || 0)} deliveries • ₹{typeof currentEarnings.averageEarningPerDelivery === 'object' ? '0' : (currentEarnings.averageEarningPerDelivery || 0)}/delivery
              </Text>
            </View>
            
            {/* Earnings Breakdown */}
            <View style={styles.breakdownContainer}>
              <Text style={styles.sectionTitle}>Earnings Breakdown</Text>
              <View style={styles.statsGrid}>
                <StatsCard
                  icon="🚚"
                  title="Delivery Fees"
                  value={`₹${typeof currentEarnings.deliveryFees === 'object' ? '0' : (currentEarnings.deliveryFees || 0)}`}
                  subtitle={`${Math.round(((typeof currentEarnings.deliveryFees === 'object' ? 0 : currentEarnings.deliveryFees) / (typeof currentEarnings.totalEarnings === 'object' ? 1 : currentEarnings.totalEarnings || 1)) * 100)}% of total`}
                  color={Colors.primary.main}
                />
                <StatsCard
                  icon="💰"
                  title="Tips"
                  value={`₹${typeof currentEarnings.tips === 'object' ? '0' : (currentEarnings.tips || 0)}`}
                  subtitle={`${Math.round(((typeof currentEarnings.tips === 'object' ? 0 : currentEarnings.tips) / (typeof currentEarnings.totalEarnings === 'object' ? 1 : currentEarnings.totalEarnings || 1)) * 100)}% of total`}
                  color={Colors.success}
                />
              </View>
              
              <View style={styles.statsGrid}>
                <StatsCard
                  icon="🎁"
                  title="Bonuses"
                  value={`₹${typeof currentEarnings.bonuses === 'object' ? '0' : (currentEarnings.bonuses || 0)}`}
                  subtitle={`${Math.round(((typeof currentEarnings.bonuses === 'object' ? 0 : currentEarnings.bonuses) / (typeof currentEarnings.totalEarnings === 'object' ? 1 : currentEarnings.totalEarnings || 1)) * 100)}% of total`}
                  color={Colors.warning}
                />
                <StatsCard
                  icon="📦"
                  title="Deliveries"
                  value={typeof currentEarnings.totalDeliveries === 'object' ? '0' : (currentEarnings.totalDeliveries || 0)}
                  subtitle={`₹${typeof currentEarnings.averageEarningPerDelivery === 'object' ? '0' : (currentEarnings.averageEarningPerDelivery || 0)} avg`}
                  color={Colors.action.info}
                />
              </View>
            </View>
            
            {/* Performance Indicators */}
            <View style={styles.performanceContainer}>
              <Text style={styles.sectionTitle}>Performance</Text>
              <View style={styles.performanceMetrics}>
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Average per Delivery:</Text>
                  <Text style={styles.metricValue}>₹{currentEarnings.averageEarningPerDelivery}</Text>
                </View>
                
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Period:</Text>
                  <Text style={styles.metricValue}>{currentEarnings.period}</Text>
                </View>
              </View>
            </View>
          </>
        )}
        
        {/* No Data State */}
        {!isEarningsLoading && !currentEarnings && !earningsError && (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataIcon}>📊</Text>
            <Text style={styles.noDataTitle}>No Earnings Data</Text>
            <Text style={styles.noDataText}>
              Start driving to see your earnings here
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
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
    marginBottom: Spacing.md,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.background.secondary,
    borderRadius: 8,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 6,
    alignItems: 'center',
  },
  activePeriodButton: {
    backgroundColor: Colors.primary.main,
  },
  periodButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.secondary,
  },
  activePeriodButtonText: {
    color: Colors.text.white,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    fontSize: Typography.fontSize.md,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  retryButton: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.text.white,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
  },
  totalEarningsCard: {
    backgroundColor: Colors.success,
    borderRadius: 16,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  totalEarningsLabel: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.white,
    opacity: 0.8,
  },
  totalEarningsValue: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.white,
    marginVertical: Spacing.sm,
  },
  totalEarningsSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.white,
    opacity: 0.9,
  },
  breakdownContainer: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  performanceContainer: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  performanceMetrics: {
    gap: Spacing.md,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
  },
  metricValue: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  noDataIcon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  noDataTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  noDataText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
});
