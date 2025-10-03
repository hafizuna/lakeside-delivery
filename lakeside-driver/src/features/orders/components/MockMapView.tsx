import React from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../shared/theme/colors';
import { Typography } from '../../../shared/theme/typography';
import { Spacing } from '../../../shared/theme/spacing';

interface MockMapViewProps {
  deliveryStatus: 'ASSIGNED' | 'EN_ROUTE_TO_RESTAURANT' | 'WAITING_AT_RESTAURANT' | 'PICKED_UP' | 'EN_ROUTE_TO_CUSTOMER' | 'DELIVERED';
  restaurant: {
    name: string;
    address: string;
    coordinates: { latitude: number; longitude: number };
  };
  customer: {
    name: string;
    address: string;
    coordinates: { latitude: number; longitude: number };
  };
}

const { width, height } = Dimensions.get('window');

const MockMapView: React.FC<MockMapViewProps> = ({
  deliveryStatus,
  restaurant,
  customer,
}) => {
  
  const getDriverPosition = () => {
    switch (deliveryStatus) {
      case 'ASSIGNED':
        return { top: '70%', left: '20%' };
      case 'EN_ROUTE_TO_RESTAURANT':
        return { top: '60%', left: '35%' };
      case 'WAITING_AT_RESTAURANT':
      case 'PICKED_UP':
        return { top: '50%', left: '50%' }; // At restaurant
      case 'EN_ROUTE_TO_CUSTOMER':
        return { top: '35%', left: '65%' };
      case 'DELIVERED':
        return { top: '20%', left: '80%' }; // At customer
      default:
        return { top: '70%', left: '20%' };
    }
  };

  const getRouteOpacity = () => {
    if (deliveryStatus === 'ASSIGNED' || deliveryStatus === 'EN_ROUTE_TO_RESTAURANT') {
      return { toRestaurant: 1, toCustomer: 0.3 };
    } else if (deliveryStatus === 'WAITING_AT_RESTAURANT' || deliveryStatus === 'PICKED_UP') {
      return { toRestaurant: 0.5, toCustomer: 1 };
    } else {
      return { toRestaurant: 0.3, toCustomer: 1 };
    }
  };

  const routeOpacity = getRouteOpacity();
  const driverPosition = getDriverPosition();

  return (
    <View style={styles.container}>
      {/* Mock Map Background */}
      <View style={styles.mapBackground}>
        {/* Street grid pattern */}
        <View style={styles.streetGrid}>
          {/* Horizontal streets */}
          <View style={[styles.street, { top: '20%' }]} />
          <View style={[styles.street, { top: '40%' }]} />
          <View style={[styles.street, { top: '60%' }]} />
          <View style={[styles.street, { top: '80%' }]} />
          
          {/* Vertical streets */}
          <View style={[styles.street, styles.verticalStreet, { left: '20%' }]} />
          <View style={[styles.street, styles.verticalStreet, { left: '40%' }]} />
          <View style={[styles.street, styles.verticalStreet, { left: '60%' }]} />
          <View style={[styles.street, styles.verticalStreet, { left: '80%' }]} />
        </View>

        {/* Route Lines */}
        {/* Route to Restaurant */}
        <View style={[
          styles.routeLine,
          styles.routeToRestaurant,
          { opacity: routeOpacity.toRestaurant }
        ]} />
        
        {/* Route to Customer */}
        <View style={[
          styles.routeLine,
          styles.routeToCustomer,
          { opacity: routeOpacity.toCustomer }
        ]} />

        {/* Restaurant Marker */}
        <View style={[styles.marker, styles.restaurantMarker]}>
          <View style={styles.markerIcon}>
            <Ionicons name="restaurant" size={20} color={Colors.text.white} />
          </View>
          <View style={styles.markerLabel}>
            <Text style={styles.markerText} numberOfLines={1}>
              {restaurant.name}
            </Text>
          </View>
        </View>

        {/* Customer Marker */}
        <View style={[styles.marker, styles.customerMarker]}>
          <View style={[styles.markerIcon, { backgroundColor: Colors.action.success }]}>
            <Ionicons name="location" size={20} color={Colors.text.white} />
          </View>
          <View style={styles.markerLabel}>
            <Text style={styles.markerText} numberOfLines={1}>
              Customer
            </Text>
          </View>
        </View>

        {/* Driver Marker (Dynamic Position) */}
        <View style={[
          styles.marker,
          styles.driverMarker,
          driverPosition as any
        ]}>
          <View style={styles.driverIcon}>
            <Ionicons name="car" size={16} color={Colors.text.white} />
          </View>
        </View>

        {/* Status overlay removed - using main status in ActiveDeliveryScreen top overlay instead */}
      </View>
    </View>
  );
};

// getStatusText function removed - status display is now handled by ActiveDeliveryScreen top overlay

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  mapBackground: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    position: 'relative',
  },
  streetGrid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  street: {
    position: 'absolute',
    backgroundColor: '#e0e0e0',
    height: 2,
    width: '100%',
  },
  verticalStreet: {
    height: '100%',
    width: 2,
  },
  routeLine: {
    position: 'absolute',
    backgroundColor: Colors.primary.main,
    borderRadius: 2,
  },
  routeToRestaurant: {
    top: '60%',
    left: '20%',
    width: '30%',
    height: 4,
    transform: [{ rotate: '-20deg' }],
  },
  routeToCustomer: {
    top: '40%',
    left: '50%',
    width: '30%',
    height: 4,
    transform: [{ rotate: '25deg' }],
  },
  marker: {
    position: 'absolute',
    alignItems: 'center',
  },
  restaurantMarker: {
    top: '50%',
    left: '50%',
    marginLeft: -25,
    marginTop: -35,
  },
  customerMarker: {
    top: '20%',
    left: '80%',
    marginLeft: -25,
    marginTop: -35,
  },
  driverMarker: {
    marginLeft: -15,
    marginTop: -15,
  },
  markerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  markerLabel: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Colors.background.primary,
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  markerText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
  },
  driverIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.action.success,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.background.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  // statusOverlay, statusBadge, and statusText styles removed - using main status in ActiveDeliveryScreen
});

export default MockMapView;