import React from 'react';
import { View, Text } from 'react-native';
import { Svg, Path, Circle, Ellipse, Rect, G, Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

// ============ EXISTING ICONS FROM CUSTOMER APP ============
// Navigation Icons
export const HomeIcon: React.FC<IconProps> = ({ size = 24, color = '#FF6B35' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9 22V12h6v10"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const OrdersIcon: React.FC<IconProps> = ({ size = 24, color = '#FF6B35' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const ProfileIcon: React.FC<IconProps> = ({ size = 24, color = '#FF6B35' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle
      cx="12"
      cy="7"
      r="4"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
    />
  </Svg>
);

export const WalletIcon: React.FC<IconProps> = ({ size = 24, color = '#FF6B35' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="walletGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#4CAF50" />
        <Stop offset="100%" stopColor="#2E7D32" />
      </LinearGradient>
    </Defs>
    <Rect x="2" y="6" width="20" height="12" rx="3" fill="url(#walletGradient)"/>
    <Rect x="4" y="8" width="16" height="8" rx="2" fill="white" opacity="0.9"/>
    <Rect x="16" y="11" width="4" height="2" rx="1" fill="url(#walletGradient)"/>
    <Circle cx="8" cy="12" r="1" fill="url(#walletGradient)"/>
  </Svg>
);

export const PhoneIcon: React.FC<IconProps> = ({ size = 24, color = '#FF6B35' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="phoneGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FF8A65" />
        <Stop offset="100%" stopColor="#FF6B35" />
      </LinearGradient>
    </Defs>
    <Path
      d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"
      fill="url(#phoneGradient)"
    />
  </Svg>
);

export const BackIcon: React.FC<IconProps> = ({ size = 24, color = '#FF6B35' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="backGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FF8A65" />
        <Stop offset="100%" stopColor="#FF6B35" />
      </LinearGradient>
    </Defs>
    <Path
      d="M19 12H5m7 7l-7-7 7-7"
      stroke="url(#backGradient)"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ============ NEW DRIVER-SPECIFIC ICONS ============

// Driver Status Icons
export const BikeIcon: React.FC<IconProps> = ({ size = 24, color = '#FF6B35' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="bikeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FF8A65" />
        <Stop offset="100%" stopColor="#FF6B35" />
      </LinearGradient>
    </Defs>
    {/* Front wheel */}
    <Circle cx="6" cy="19" r="3" fill="none" stroke="url(#bikeGradient)" strokeWidth="2"/>
    {/* Back wheel */}
    <Circle cx="18" cy="19" r="3" fill="none" stroke="url(#bikeGradient)" strokeWidth="2"/>
    {/* Frame */}
    <Path d="M12 19l-3-7 2-3h4l2 3-3 7" stroke="url(#bikeGradient)" strokeWidth="2" fill="none"/>
    {/* Handlebar */}
    <Path d="M8 9h8" stroke="url(#bikeGradient)" strokeWidth="2" strokeLinecap="round"/>
    {/* Seat */}
    <Path d="M10 7h4" stroke="url(#bikeGradient)" strokeWidth="3" strokeLinecap="round"/>
    {/* Delivery box */}
    <Rect x="14" y="5" width="6" height="4" rx="1" fill="url(#bikeGradient)" opacity="0.8"/>
  </Svg>
);

export const OnlineStatusIcon: React.FC<IconProps> = ({ size = 24, color = '#4CAF50' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="onlineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#4CAF50" />
        <Stop offset="100%" stopColor="#2E7D32" />
      </LinearGradient>
    </Defs>
    <Circle cx="12" cy="12" r="10" fill="url(#onlineGradient)"/>
    <Path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    {/* Signal waves */}
    <Circle cx="12" cy="12" r="12" fill="none" stroke="url(#onlineGradient)" strokeWidth="1" opacity="0.3"/>
    <Circle cx="12" cy="12" r="14" fill="none" stroke="url(#onlineGradient)" strokeWidth="1" opacity="0.2"/>
  </Svg>
);

export const OfflineStatusIcon: React.FC<IconProps> = ({ size = 24, color = '#F44336' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="offlineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#F44336" />
        <Stop offset="100%" stopColor="#D32F2F" />
      </LinearGradient>
    </Defs>
    <Circle cx="12" cy="12" r="10" fill="url(#offlineGradient)"/>
    <Path d="M15 9l-6 6M9 9l6 6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
  </Svg>
);

// Navigation Icons
export const RouteIcon: React.FC<IconProps> = ({ size = 24, color = '#FF6B35' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FF8A65" />
        <Stop offset="100%" stopColor="#FF6B35" />
      </LinearGradient>
    </Defs>
    {/* Path line */}
    <Path d="M3 12c0-7 3-10 6-10s6 3 6 10-3 10-6 10-6-3-6-10z" stroke="url(#routeGradient)" strokeWidth="2" fill="none"/>
    <Path d="M15 12c0-4 2-6 4-6s4 2 4 6-2 6-4 6-4-2-4-6z" stroke="url(#routeGradient)" strokeWidth="2" fill="none"/>
    {/* Start point */}
    <Circle cx="9" cy="7" r="2" fill="url(#routeGradient)"/>
    {/* End point */}
    <Circle cx="19" cy="17" r="2" fill="url(#routeGradient)"/>
    {/* Route points */}
    <Circle cx="9" cy="12" r="1" fill="url(#routeGradient)"/>
    <Circle cx="9" cy="17" r="1" fill="url(#routeGradient)"/>
  </Svg>
);

export const NavigationIcon: React.FC<IconProps> = ({ size = 24, color = '#FF6B35' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="navigationGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#2196F3" />
        <Stop offset="100%" stopColor="#1976D2" />
      </LinearGradient>
    </Defs>
    <Circle cx="12" cy="12" r="10" fill="url(#navigationGradient)"/>
    <Path d="M8 12l4-6 4 6-4 2-4-2z" fill="white"/>
    <Circle cx="12" cy="12" r="1" fill="url(#navigationGradient)"/>
  </Svg>
);

export const LocationPinIcon: React.FC<IconProps> = ({ size = 24, color = '#F44336' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="locationGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#F44336" />
        <Stop offset="100%" stopColor="#D32F2F" />
      </LinearGradient>
    </Defs>
    <Path
      d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"
      fill="url(#locationGradient)"
    />
    <Circle cx="12" cy="10" r="3" fill="white"/>
  </Svg>
);

export const TrafficIcon: React.FC<IconProps> = ({ size = 24, color = '#FF6B35' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="trafficGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FF9800" />
        <Stop offset="100%" stopColor="#F57C00" />
      </LinearGradient>
    </Defs>
    <Rect x="10" y="2" width="4" height="20" rx="2" fill="url(#trafficGradient)"/>
    <Circle cx="12" cy="6" r="2" fill="#F44336"/>
    <Circle cx="12" cy="12" r="2" fill="#FF9800"/>
    <Circle cx="12" cy="18" r="2" fill="#4CAF50"/>
  </Svg>
);

// Delivery Icons
export const DeliveryBoxIcon: React.FC<IconProps> = ({ size = 24, color = '#FF6B35' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="boxGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FF8A65" />
        <Stop offset="100%" stopColor="#FF6B35" />
      </LinearGradient>
    </Defs>
    <Path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" 
      fill="url(#boxGradient)"/>
    <Path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke="white" strokeWidth="2"/>
    {/* Food icon */}
    <Circle cx="12" cy="12" r="2" fill="white" opacity="0.8"/>
  </Svg>
);

export const PickupIcon: React.FC<IconProps> = ({ size = 24, color = '#4CAF50' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="pickupGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#4CAF50" />
        <Stop offset="100%" stopColor="#2E7D32" />
      </LinearGradient>
    </Defs>
    <Circle cx="12" cy="12" r="10" fill="url(#pickupGradient)"/>
    <Path d="M8 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M12 6v12M6 12h12" stroke="white" strokeWidth="1" opacity="0.3"/>
  </Svg>
);

export const DeliveredIcon: React.FC<IconProps> = ({ size = 24, color = '#4CAF50' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="deliveredGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#4CAF50" />
        <Stop offset="100%" stopColor="#2E7D32" />
      </LinearGradient>
    </Defs>
    <Circle cx="12" cy="12" r="10" fill="url(#deliveredGradient)"/>
    <Path d="M9 12l2 2 4-4" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    {/* Celebration sparkles */}
    <Circle cx="7" cy="7" r="1" fill="#FFD700"/>
    <Circle cx="17" cy="7" r="1" fill="#FFD700"/>
    <Circle cx="7" cy="17" r="1" fill="#FFD700"/>
    <Circle cx="17" cy="17" r="1" fill="#FFD700"/>
  </Svg>
);

export const TimerIcon: React.FC<IconProps> = ({ size = 24, color = '#FF9800' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FF9800" />
        <Stop offset="100%" stopColor="#F57C00" />
      </LinearGradient>
    </Defs>
    <Circle cx="12" cy="13" r="9" fill="url(#timerGradient)"/>
    <Path d="M12 7v6l4 2" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    <Path d="M9 2h6" stroke="url(#timerGradient)" strokeWidth="2" strokeLinecap="round"/>
    <Path d="M15 4l2-2" stroke="url(#timerGradient)" strokeWidth="2" strokeLinecap="round"/>
  </Svg>
);

// Earnings Icons
export const EarningsIcon: React.FC<IconProps> = ({ size = 24, color = '#4CAF50' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="earningsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#4CAF50" />
        <Stop offset="100%" stopColor="#2E7D32" />
      </LinearGradient>
    </Defs>
    <Circle cx="12" cy="12" r="10" fill="url(#earningsGradient)"/>
    <Path d="M12 6v12M9 8h6M9 16h6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    <Circle cx="12" cy="12" r="3" fill="none" stroke="white" strokeWidth="2"/>
  </Svg>
);

export const WithdrawalIcon: React.FC<IconProps> = ({ size = 24, color = '#2196F3' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="withdrawalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#2196F3" />
        <Stop offset="100%" stopColor="#1976D2" />
      </LinearGradient>
    </Defs>
    <Rect x="2" y="6" width="20" height="12" rx="3" fill="url(#withdrawalGradient)"/>
    <Path d="M8 12h8M12 8l4 4-4 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export const BankIcon: React.FC<IconProps> = ({ size = 24, color = '#9C27B0' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="bankGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#9C27B0" />
        <Stop offset="100%" stopColor="#6A1B9A" />
      </LinearGradient>
    </Defs>
    <Rect x="2" y="8" width="20" height="12" rx="2" fill="url(#bankGradient)"/>
    <Path d="M3 8l9-5 9 5" stroke="url(#bankGradient)" strokeWidth="2" fill="none"/>
    <Path d="M6 12v5M10 12v5M14 12v5M18 12v5" stroke="white" strokeWidth="1.5"/>
    <Rect x="11" y="3" width="2" height="2" fill="#FFD700"/>
  </Svg>
);

// Vehicle Icons
export const SpeedometerIcon: React.FC<IconProps> = ({ size = 24, color = '#FF6B35' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="speedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FF8A65" />
        <Stop offset="100%" stopColor="#FF6B35" />
      </LinearGradient>
    </Defs>
    <Circle cx="12" cy="14" r="8" fill="none" stroke="url(#speedGradient)" strokeWidth="2"/>
    <Path d="M8 18l4-4 4 4" stroke="url(#speedGradient)" strokeWidth="2" fill="none"/>
    <Circle cx="12" cy="14" r="2" fill="url(#speedGradient)"/>
    {/* Speed marks */}
    <Path d="M6 14h2M16 14h2M12 6v2M8.5 8.5l1.4 1.4M15.5 8.5l-1.4 1.4" 
      stroke="url(#speedGradient)" strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

export const FuelIcon: React.FC<IconProps> = ({ size = 24, color = '#FF9800' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="fuelGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FF9800" />
        <Stop offset="100%" stopColor="#F57C00" />
      </LinearGradient>
    </Defs>
    <Rect x="4" y="6" width="12" height="14" rx="2" fill="none" stroke="url(#fuelGradient)" strokeWidth="2"/>
    <Rect x="6" y="9" width="8" height="8" rx="1" fill="url(#fuelGradient)" opacity="0.3"/>
    <Path d="M16 10h2a2 2 0 012 2v2a2 2 0 01-2 2h-2" stroke="url(#fuelGradient)" strokeWidth="2"/>
    <Path d="M8 3v3M12 3v3" stroke="url(#fuelGradient)" strokeWidth="2" strokeLinecap="round"/>
  </Svg>
);

export const VehicleIcon: React.FC<IconProps> = ({ size = 24, color = '#FF6B35' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="vehicleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FF8A65" />
        <Stop offset="100%" stopColor="#FF6B35" />
      </LinearGradient>
    </Defs>
    <Rect x="2" y="10" width="20" height="8" rx="2" fill="url(#vehicleGradient)"/>
    <Circle cx="7" cy="18" r="2" fill="none" stroke="url(#vehicleGradient)" strokeWidth="2"/>
    <Circle cx="17" cy="18" r="2" fill="none" stroke="url(#vehicleGradient)" strokeWidth="2"/>
    <Path d="M6 10V6a2 2 0 012-2h8a2 2 0 012 2v4" stroke="url(#vehicleGradient)" strokeWidth="2"/>
    <Rect x="4" y="8" width="4" height="2" rx="1" fill="white"/>
    <Rect x="16" y="8" width="4" height="2" rx="1" fill="white"/>
  </Svg>
);

export const DocumentIcon: React.FC<IconProps> = ({ size = 24, color = '#2196F3' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="documentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#2196F3" />
        <Stop offset="100%" stopColor="#1976D2" />
      </LinearGradient>
    </Defs>
    <Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" fill="url(#documentGradient)"/>
    <Path d="M14 2v6h6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M8 13h8M8 17h8M8 9h2" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

// Status & Action Icons
export const AcceptIcon: React.FC<IconProps> = ({ size = 24, color = '#4CAF50' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="acceptGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#4CAF50" />
        <Stop offset="100%" stopColor="#2E7D32" />
      </LinearGradient>
    </Defs>
    <Circle cx="12" cy="12" r="10" fill="url(#acceptGradient)"/>
    <Path d="M9 12l2 2 4-4" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export const DeclineIcon: React.FC<IconProps> = ({ size = 24, color = '#F44336' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="declineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#F44336" />
        <Stop offset="100%" stopColor="#D32F2F" />
      </LinearGradient>
    </Defs>
    <Circle cx="12" cy="12" r="10" fill="url(#declineGradient)"/>
    <Path d="M15 9l-6 6M9 9l6 6" stroke="white" strokeWidth="3" strokeLinecap="round"/>
  </Svg>
);

export const DistanceIcon: React.FC<IconProps> = ({ size = 24, color = '#2196F3' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="distanceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#2196F3" />
        <Stop offset="100%" stopColor="#1976D2" />
      </LinearGradient>
    </Defs>
    <Circle cx="6" cy="18" r="3" fill="none" stroke="url(#distanceGradient)" strokeWidth="2"/>
    <Circle cx="18" cy="6" r="3" fill="none" stroke="url(#distanceGradient)" strokeWidth="2"/>
    <Path d="M9 15l6-6" stroke="url(#distanceGradient)" strokeWidth="2" strokeLinecap="round"/>
    <Path d="M15 15l3-3M9 9L6 6" stroke="url(#distanceGradient)" strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

// Dashboard Icons
export const DashboardIcon: React.FC<IconProps> = ({ size = 24, color = '#FF6B35' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="dashboardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FF8A65" />
        <Stop offset="100%" stopColor="#FF6B35" />
      </LinearGradient>
    </Defs>
    <Rect x="3" y="3" width="7" height="9" rx="2" fill="url(#dashboardGradient)"/>
    <Rect x="14" y="3" width="7" height="5" rx="2" fill="url(#dashboardGradient)" opacity="0.7"/>
    <Rect x="14" y="12" width="7" height="9" rx="2" fill="url(#dashboardGradient)" opacity="0.7"/>
    <Rect x="3" y="16" width="7" height="5" rx="2" fill="url(#dashboardGradient)" opacity="0.7"/>
  </Svg>
);

export const StarIcon: React.FC<IconProps & { filled?: boolean }> = ({ size = 24, color = '#FFD700', filled = false }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="starGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFD700" />
        <Stop offset="100%" stopColor="#FFA000" />
      </LinearGradient>
    </Defs>
    <Path
      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
      fill={filled ? "url(#starGradient)" : "none"}
      stroke={filled ? "none" : "url(#starGradient)"}
      strokeWidth="2"
    />
  </Svg>
);

// Map and GPS Icons
export const GpsIcon: React.FC<IconProps> = ({ size = 24, color = '#4CAF50' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="gpsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#4CAF50" />
        <Stop offset="100%" stopColor="#2E7D32" />
      </LinearGradient>
    </Defs>
    <Circle cx="12" cy="12" r="3" fill="url(#gpsGradient)"/>
    <Circle cx="12" cy="12" r="8" fill="none" stroke="url(#gpsGradient)" strokeWidth="2" strokeDasharray="2,2"/>
    <Path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="url(#gpsGradient)" strokeWidth="2" strokeLinecap="round"/>
  </Svg>
);

export const MapIcon: React.FC<IconProps> = ({ size = 24, color = '#FF6B35' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="mapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FF8A65" />
        <Stop offset="100%" stopColor="#FF6B35" />
      </LinearGradient>
    </Defs>
    <Path
      d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"
      fill="url(#mapGradient)"
    />
    <Circle cx="12" cy="10" r="3" fill="white"/>
  </Svg>
);

// Reuse essential icons from customer app
export const CheckIcon: React.FC<IconProps> = ({ size = 24, color = '#4CAF50' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="checkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#4CAF50" />
        <Stop offset="100%" stopColor="#2E7D32" />
      </LinearGradient>
    </Defs>
    <Circle cx="12" cy="12" r="10" fill="url(#checkGradient)"/>
    <Path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export const LockIcon: React.FC<IconProps> = ({ size = 24, color = '#FF6B35' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="lockGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FF8A65" />
        <Stop offset="100%" stopColor="#FF6B35" />
      </LinearGradient>
    </Defs>
    <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" fill="url(#lockGradient)"/>
    <Circle cx="12" cy="16" r="1" fill="white"/>
    <Path d="M7 11V7a5 5 0 0110 0v4" stroke="url(#lockGradient)" strokeWidth="2" 
      strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </Svg>
);

export const EyeIcon: React.FC<IconProps> = ({ size = 24, color = '#FF6B35' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="eyeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FF8A65" />
        <Stop offset="100%" stopColor="#FF6B35" />
      </LinearGradient>
    </Defs>
    <Path
      d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
      stroke="url(#eyeGradient)"
      strokeWidth="2"
      fill="none"
    />
    <Circle cx="12" cy="12" r="3" stroke="url(#eyeGradient)" strokeWidth="2" fill="none"/>
  </Svg>
);

export const EyeOffIcon: React.FC<IconProps> = ({ size = 24, color = '#FF6B35' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="eyeOffGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FF8A65" />
        <Stop offset="100%" stopColor="#FF6B35" />
      </LinearGradient>
    </Defs>
    <Path
      d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"
      stroke="url(#eyeOffGradient)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <Path
      d="M1 1l22 22"
      stroke="url(#eyeOffGradient)"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Svg>
);

export const CameraIcon: React.FC<IconProps> = ({ size = 24, color = '#FF6B35' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="cameraGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FF8A65" />
        <Stop offset="100%" stopColor="#FF6B35" />
      </LinearGradient>
    </Defs>
    <Path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2v11z" fill="url(#cameraGradient)"/>
    <Circle cx="12" cy="13" r="4" stroke="white" strokeWidth="2" fill="none"/>
    <Circle cx="12" cy="13" r="2" fill="white"/>
  </Svg>
);

// Additional icons for Wallet and Profile screens
export const ArrowUpIcon: React.FC<IconProps> = ({ size = 24, color = '#4CAF50' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 19V5M5 12l7-7 7 7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export const ArrowDownIcon: React.FC<IconProps> = ({ size = 24, color = '#F44336' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 5v14M19 12l-7 7-7-7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export const TrendUpIcon: React.FC<IconProps> = ({ size = 24, color = '#4CAF50' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M23 6l-9.5 9.5-5-5L1 18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M17 6h6v6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export const ClockIcon: React.FC<IconProps> = ({ size = 24, color = '#FF9800' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2"/>
    <Path d="M12 6v6l4 2" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </Svg>
);

export const WithdrawIcon: React.FC<IconProps> = ({ size = 24, color = '#2196F3' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M7 16l-4-4m0 0l4-4m-4 4h18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export const CalendarIcon: React.FC<IconProps> = ({ size = 24, color = '#9C27B0' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke={color} strokeWidth="2"/>
    <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </Svg>
);

export const HistoryIcon: React.FC<IconProps> = ({ size = 24, color = '#FF6B35' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2"/>
    <Path d="M12 6v6l4 2" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <Path d="M4 4l5 5" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </Svg>
);

// Additional utility icons
export const EditIcon: React.FC<IconProps> = ({ size = 24, color = '#2196F3' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export const LogoutIcon: React.FC<IconProps> = ({ size = 24, color = '#F44336' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M16 17l5-5-5-5M21 12H9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export const NotificationIcon: React.FC<IconProps> = ({ size = 24, color = '#FF9800' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M13.73 21a2 2 0 01-3.46 0" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export const LocationIcon: React.FC<IconProps> = ({ size = 24, color = '#4CAF50' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke={color} strokeWidth="2"/>
    <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth="2"/>
  </Svg>
);

export const SettingsIcon: React.FC<IconProps> = ({ size = 24, color = '#666' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2"/>
    <Path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export const UserIcon: React.FC<IconProps> = ({ size = 24, color = '#FF6B35' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth="2"/>
  </Svg>
);

export const RestaurantIcon: React.FC<IconProps> = ({ size = 24, color = '#FF6B35' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="restaurantGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FF8A65" />
        <Stop offset="100%" stopColor="#FF6B35" />
      </LinearGradient>
    </Defs>
    {/* Building */}
    <Rect x="4" y="8" width="16" height="12" rx="2" fill="url(#restaurantGradient)"/>
    {/* Roof */}
    <Path d="M2 8l10-6 10 6" stroke="url(#restaurantGradient)" strokeWidth="2" fill="none"/>
    {/* Door */}
    <Rect x="10" y="14" width="4" height="6" fill="white"/>
    {/* Windows */}
    <Rect x="6" y="11" width="2" height="2" fill="white"/>
    <Rect x="16" y="11" width="2" height="2" fill="white"/>
    {/* Chef hat on roof */}
    <Ellipse cx="12" cy="6" rx="2" ry="1" fill="white"/>
    <Rect x="11" y="4" width="2" height="3" fill="white"/>
  </Svg>
);

export const CustomerIcon: React.FC<IconProps> = ({ size = 24, color = '#4CAF50' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="customerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#4CAF50" />
        <Stop offset="100%" stopColor="#2E7D32" />
      </LinearGradient>
    </Defs>
    {/* House */}
    <Path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" fill="url(#customerGradient)"/>
    {/* Door */}
    <Rect x="10" y="15" width="4" height="5" fill="white"/>
    {/* Window */}
    <Rect x="7" y="12" width="3" height="3" fill="white"/>
    <Rect x="14" y="12" width="3" height="3" fill="white"/>
    {/* Chimney */}
    <Rect x="16" y="6" width="2" height="4" fill="url(#customerGradient)"/>
  </Svg>
);

export const RefreshIcon: React.FC<IconProps> = ({ size = 24, color = '#2196F3' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="refreshGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#2196F3" />
        <Stop offset="100%" stopColor="#1976D2" />
      </LinearGradient>
    </Defs>
    <Path 
      d="M1 4v6h6m16 10v-6h-6"
      stroke="url(#refreshGradient)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path 
      d="M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15"
      stroke="url(#refreshGradient)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
