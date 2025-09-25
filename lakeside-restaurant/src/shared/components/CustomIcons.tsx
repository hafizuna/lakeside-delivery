import React from 'react';
import Svg, { Path, Circle, Rect, Polyline, Line, Defs, LinearGradient, Stop } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

// Navigation Icons
export const HomeIcon: React.FC<IconProps> = ({ size = 24, color = '#FF6B35' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="homeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FF8A65" />
        <Stop offset="100%" stopColor="#FF6B35" />
      </LinearGradient>
    </Defs>
    <Path
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m0 0V11a1 1 0 011-1h2a1 1 0 011 1v10m-4 0h4m0 0v-1a1 1 0 011-1h2a1 1 0 011 1v1"
      fill="none"
      stroke="url(#homeGradient)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const OrdersIcon: React.FC<IconProps> = ({ size = 24, color = '#FF6B35' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="ordersGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FF8A65" />
        <Stop offset="100%" stopColor="#FF6B35" />
      </LinearGradient>
    </Defs>
    <Path
      d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
      fill="none"
      stroke="url(#ordersGradient)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
      stroke="url(#ordersGradient)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const MenuIcon: React.FC<IconProps> = ({ size = 24, color = '#FF6B35' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="menuGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FF8A65" />
        <Stop offset="100%" stopColor="#FF6B35" />
      </LinearGradient>
    </Defs>
    <Path
      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
      fill="url(#menuGradient)"
    />
  </Svg>
);

export const InventoryIcon: React.FC<IconProps> = ({ size = 24, color = '#FF6B35' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="inventoryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FF8A65" />
        <Stop offset="100%" stopColor="#FF6B35" />
      </LinearGradient>
    </Defs>
    <Rect
      x="3"
      y="3"
      width="7"
      height="7"
      rx="1"
      fill="url(#inventoryGradient)"
    />
    <Rect
      x="14"
      y="3"
      width="7"
      height="7"
      rx="1"
      fill="url(#inventoryGradient)"
    />
    <Rect
      x="14"
      y="14"
      width="7"
      height="7"
      rx="1"
      fill="url(#inventoryGradient)"
    />
    <Rect
      x="3"
      y="14"
      width="7"
      height="7"
      rx="1"
      fill="url(#inventoryGradient)"
    />
  </Svg>
);

export const ProfileIcon: React.FC<IconProps> = ({ size = 24, color = '#FF6B35' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="profileGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FF8A65" />
        <Stop offset="100%" stopColor="#FF6B35" />
      </LinearGradient>
    </Defs>
    <Path
      d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"
      fill="none"
      stroke="url(#profileGradient)"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle
      cx="12"
      cy="7"
      r="4"
      fill="none"
      stroke="url(#profileGradient)"
      strokeWidth="2.5"
    />
  </Svg>
);

// Status Icons
export const CookingIcon: React.FC<IconProps> = ({ size = 24, color = '#FF6B35' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="cookingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FF8A65" />
        <Stop offset="100%" stopColor="#FF6B35" />
      </LinearGradient>
    </Defs>
    <Path
      d="M6 10h12v8a2 2 0 01-2 2H8a2 2 0 01-2-2v-8z"
      fill="url(#cookingGradient)"
    />
    <Path
      d="M6 10V6a6 6 0 0112 0v4"
      fill="none"
      stroke="url(#cookingGradient)"
      strokeWidth="2"
    />
    <Circle cx="12" cy="14" r="2" fill="#FFF" />
    {/* Steam */}
    <Path d="M9 4c0 1-1 1-1 2s1 1 1 2" stroke="#B0BEC5" strokeWidth="1.5" strokeLinecap="round"/>
    <Path d="M12 3c0 1-1 1-1 2s1 1 1 2" stroke="#B0BEC5" strokeWidth="1.5" strokeLinecap="round"/>
    <Path d="M15 4c0 1-1 1-1 2s1 1 1 2" stroke="#B0BEC5" strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

export const ClockIcon: React.FC<IconProps> = ({ size = 24, color = '#FF6B35' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="clockGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FF8A65" />
        <Stop offset="100%" stopColor="#FF6B35" />
      </LinearGradient>
    </Defs>
    <Circle
      cx="12"
      cy="12"
      r="10"
      fill="none"
      stroke="url(#clockGradient)"
      strokeWidth="2"
    />
    <Path
      d="M12 6v6l4 2"
      stroke="url(#clockGradient)"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Svg>
);

export const CheckIcon: React.FC<IconProps> = ({ size = 24, color = '#4CAF50' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="checkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#81C784" />
        <Stop offset="100%" stopColor="#4CAF50" />
      </LinearGradient>
    </Defs>
    <Circle
      cx="12"
      cy="12"
      r="10"
      fill="url(#checkGradient)"
    />
    <Path
      d="M9 12l2 2 4-4"
      stroke="#FFF"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const AddIcon: React.FC<IconProps> = ({ size = 24, color = '#FF6B35' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="addGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FF8A65" />
        <Stop offset="100%" stopColor="#FF6B35" />
      </LinearGradient>
    </Defs>
    <Circle
      cx="12"
      cy="12"
      r="10"
      fill="url(#addGradient)"
    />
    <Path
      d="M12 8v8M8 12h8"
      stroke="#FFF"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Svg>
);

export const SettingsIcon: React.FC<IconProps> = ({ size = 24, color = '#FF6B35' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="settingsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FF8A65" />
        <Stop offset="100%" stopColor="#FF6B35" />
      </LinearGradient>
    </Defs>
    <Circle
      cx="12"
      cy="12"
      r="3"
      fill="none"
      stroke="url(#settingsGradient)"
      strokeWidth="2"
    />
    <Path
      d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"
      fill="none"
      stroke="url(#settingsGradient)"
      strokeWidth="2"
    />
  </Svg>
);

export const HeartIcon: React.FC<IconProps & { filled?: boolean }> = ({ size = 24, color = '#FF6B35', filled = false }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="heartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FF6B9D" />
        <Stop offset="100%" stopColor="#DC143C" />
      </LinearGradient>
    </Defs>
    <Path
      d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
      fill={filled ? "url(#heartGradient)" : "none"}
      stroke={filled ? "none" : "url(#heartGradient)"}
      strokeWidth="2"
    />
  </Svg>
);

// Dashboard Icons
export const TrendingUpIcon: React.FC<IconProps> = ({ size = 24, color = '#4CAF50' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="trendingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#81C784" />
        <Stop offset="100%" stopColor="#4CAF50" />
      </LinearGradient>
    </Defs>
    <Path d="M23 6L13.5 15.5L8.5 10.5L1 18" stroke="url(#trendingGradient)" strokeWidth="2" fill="none"/>
    <Path d="M17 6L23 6L23 12" stroke="url(#trendingGradient)" strokeWidth="2" fill="none"/>
  </Svg>
);

export const ReceiptIcon: React.FC<IconProps> = ({ size = 24, color = '#FF6B35' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="receiptGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FF8A65" />
        <Stop offset="100%" stopColor="#FF6B35" />
      </LinearGradient>
    </Defs>
    <Path d="M18 17H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2Z" stroke="url(#receiptGradient)" strokeWidth="2" fill="none"/>
    <Path d="M6 9h12" stroke="url(#receiptGradient)" strokeWidth="2"/>
    <Path d="M6 12h12" stroke="url(#receiptGradient)" strokeWidth="2"/>
    <Path d="M6 15h12" stroke="url(#receiptGradient)" strokeWidth="2"/>
  </Svg>
);

export const ShoppingBagIcon: React.FC<IconProps> = ({ size = 24, color = '#2196F3' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="bagGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#64B5F6" />
        <Stop offset="100%" stopColor="#2196F3" />
      </LinearGradient>
    </Defs>
    <Path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" stroke="url(#bagGradient)" strokeWidth="2" fill="none"/>
    <Path d="M3 6h18" stroke="url(#bagGradient)" strokeWidth="2"/>
    <Path d="M16 10a4 4 0 0 1-8 0" stroke="url(#bagGradient)" strokeWidth="2" fill="none"/>
  </Svg>
);

export const DollarIcon: React.FC<IconProps> = ({ size = 24, color = '#4CAF50' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="dollarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#81C784" />
        <Stop offset="100%" stopColor="#4CAF50" />
      </LinearGradient>
    </Defs>
    <Path d="M12 1v22" stroke="url(#dollarGradient)" strokeWidth="2"/>
    <Path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="url(#dollarGradient)" strokeWidth="2" fill="none"/>
  </Svg>
);

export const TargetIcon: React.FC<IconProps> = ({ size = 24, color = '#FF9800' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="targetGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFB74D" />
        <Stop offset="100%" stopColor="#FF9800" />
      </LinearGradient>
    </Defs>
    <Circle cx="12" cy="12" r="10" stroke="url(#targetGradient)" strokeWidth="2" fill="none"/>
    <Circle cx="12" cy="12" r="6" stroke="url(#targetGradient)" strokeWidth="2" fill="none"/>
    <Circle cx="12" cy="12" r="2" stroke="url(#targetGradient)" strokeWidth="2" fill="none"/>
  </Svg>
);

export const CalendarIcon: React.FC<IconProps> = ({ size = 24, color = '#FF6B35' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="calendarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FF8A65" />
        <Stop offset="100%" stopColor="#FF6B35" />
      </LinearGradient>
    </Defs>
    <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="url(#calendarGradient)" strokeWidth="2" fill="none"/>
    <Path d="M16 2v4" stroke="url(#calendarGradient)" strokeWidth="2"/>
    <Path d="M8 2v4" stroke="url(#calendarGradient)" strokeWidth="2"/>
    <Path d="M3 10h18" stroke="url(#calendarGradient)" strokeWidth="2"/>
  </Svg>
);

export const StoreIcon: React.FC<IconProps> = ({ size = 24, color = '#4CAF50' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="storeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#81C784" />
        <Stop offset="100%" stopColor="#4CAF50" />
      </LinearGradient>
    </Defs>
    <Path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z" stroke="url(#storeGradient)" strokeWidth="2" fill="none"/>
    <Path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="url(#storeGradient)" strokeWidth="2" fill="none"/>
    <Path d="M12 12v3" stroke="url(#storeGradient)" strokeWidth="2"/>
    <Path d="M8 12h8" stroke="url(#storeGradient)" strokeWidth="2"/>
  </Svg>
);

export const StoreOffIcon: React.FC<IconProps> = ({ size = 24, color = '#F44336' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="storeOffGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#EF5350" />
        <Stop offset="100%" stopColor="#F44336" />
      </LinearGradient>
    </Defs>
    <Path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z" stroke="url(#storeOffGradient)" strokeWidth="2" fill="none"/>
    <Path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="url(#storeOffGradient)" strokeWidth="2" fill="none"/>
    <Path d="M18 6L6 18" stroke="url(#storeOffGradient)" strokeWidth="2"/>
  </Svg>
);

// Menu Screen Icons
export const SearchIcon: React.FC<IconProps> = ({ size = 24, color = '#FF6B35' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="searchGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FF8A65" />
        <Stop offset="100%" stopColor="#FF6B35" />
      </LinearGradient>
    </Defs>
    <Circle cx="11" cy="11" r="8" stroke="url(#searchGradient)" strokeWidth="2" fill="none"/>
    <Path d="M21 21l-4.35-4.35" stroke="url(#searchGradient)" strokeWidth="2" fill="none"/>
  </Svg>
);

export const FilterIcon: React.FC<IconProps> = ({ size = 24, color = '#FF6B35' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="filterGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FF8A65" />
        <Stop offset="100%" stopColor="#FF6B35" />
      </LinearGradient>
    </Defs>
    <Path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" stroke="url(#filterGradient)" strokeWidth="2" fill="none"/>
  </Svg>
);

export const EditIcon: React.FC<IconProps> = ({ size = 24, color = '#FF6B35' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="editGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FF8A65" />
        <Stop offset="100%" stopColor="#FF6B35" />
      </LinearGradient>
    </Defs>
    <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="url(#editGradient)" strokeWidth="2" fill="none"/>
    <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="url(#editGradient)" strokeWidth="2" fill="none"/>
  </Svg>
);

// Form Icons
export const ArrowBackIcon: React.FC<IconProps> = ({ size = 24, color = '#FF6B35' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="arrowBackGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FF8A65" />
        <Stop offset="100%" stopColor="#FF6B35" />
      </LinearGradient>
    </Defs>
    <Path d="M19 12H5" stroke="url(#arrowBackGradient)" strokeWidth="2"/>
    <Path d="M12 19l-7-7 7-7" stroke="url(#arrowBackGradient)" strokeWidth="2" fill="none"/>
  </Svg>
);

export const SaveIcon: React.FC<IconProps> = ({ size = 24, color = '#4CAF50' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="saveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#81C784" />
        <Stop offset="100%" stopColor="#4CAF50" />
      </LinearGradient>
    </Defs>
    <Path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" stroke="url(#saveGradient)" strokeWidth="2" fill="none"/>
    <Path d="M17 21v-8H7v8" stroke="url(#saveGradient)" strokeWidth="2" fill="none"/>
    <Path d="M7 3v5h8" stroke="url(#saveGradient)" strokeWidth="2" fill="none"/>
  </Svg>
);

export const TrashIcon: React.FC<IconProps> = ({ size = 24, color = '#F44336' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="trashGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#EF5350" />
        <Stop offset="100%" stopColor="#F44336" />
      </LinearGradient>
    </Defs>
    <Path d="M3 6h18" stroke="url(#trashGradient)" strokeWidth="2"/>
    <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="url(#trashGradient)" strokeWidth="2" fill="none"/>
    <Path d="M10 11v6" stroke="url(#trashGradient)" strokeWidth="2"/>
    <Path d="M14 11v6" stroke="url(#trashGradient)" strokeWidth="2"/>
  </Svg>
);

export const ImageIcon: React.FC<IconProps> = ({ size = 24, color = '#FF6B35' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="imageGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FF8A65" />
        <Stop offset="100%" stopColor="#FF6B35" />
      </LinearGradient>
    </Defs>
    <Rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="url(#imageGradient)" strokeWidth="2" fill="none"/>
    <Circle cx="8.5" cy="8.5" r="1.5" stroke="url(#imageGradient)" strokeWidth="2" fill="none"/>
    <Path d="M21 15l-5-5L5 21" stroke="url(#imageGradient)" strokeWidth="2" fill="none"/>
  </Svg>
);

export const TagIcon: React.FC<IconProps> = ({ size = 24, color = '#FF6B35' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="tagGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FF8A65" />
        <Stop offset="100%" stopColor="#FF6B35" />
      </LinearGradient>
    </Defs>
    <Path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" stroke="url(#tagGradient)" strokeWidth="2" fill="none"/>
    <Path d="M7 7h.01" stroke="url(#tagGradient)" strokeWidth="2"/>
  </Svg>
);

export const ToggleOnIcon: React.FC<IconProps> = ({ size = 24, color = '#4CAF50' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="toggleOnGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#81C784" />
        <Stop offset="100%" stopColor="#4CAF50" />
      </LinearGradient>
    </Defs>
    <Rect x="1" y="5" width="22" height="14" rx="7" ry="7" fill="url(#toggleOnGradient)"/>
    <Circle cx="16" cy="12" r="3" fill="#FFF"/>
  </Svg>
);

export const ToggleOffIcon: React.FC<IconProps> = ({ size = 24, color = '#9E9E9E' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="1" y="5" width="22" height="14" rx="7" ry="7" stroke={color} strokeWidth="2" fill="none"/>
    <Circle cx="8" cy="12" r="3" stroke={color} strokeWidth="2" fill="none"/>
  </Svg>
);

export const ChevronDownIcon: React.FC<IconProps> = ({ size = 24, color = '#FF6B35' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2" fill="none"/>
  </Svg>
);

export const CloseIcon: React.FC<IconProps> = ({ size = 24, color = '#FF6B35' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18" stroke={color} strokeWidth="2"/>
    <Path d="M6 6l12 12" stroke={color} strokeWidth="2"/>
  </Svg>
);

export const PlusIcon: React.FC<IconProps> = ({ size = 24, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 5v14" stroke={color} strokeWidth="2"/>
    <Path d="M5 12h14" stroke={color} strokeWidth="2"/>
  </Svg>
);

export const LockIcon: React.FC<IconProps> = ({ size = 24, color = '#9E9E9E' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke={color} strokeWidth="2" fill="none"/>
    <Circle cx="12" cy="16" r="1" fill={color}/>
    <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth="2" fill="none"/>
  </Svg>
);

export const NotificationIcon: React.FC<IconProps> = ({ size = 24, color = '#9E9E9E' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={color} strokeWidth="2" fill="none"/>
    <Path d="M13.73 21a2 2 0 0 1-3.46 0" stroke={color} strokeWidth="2" fill="none"/>
  </Svg>
);

export const CardIcon: React.FC<IconProps> = ({ size = 24, color = '#9E9E9E' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="1" y="4" width="22" height="16" rx="2" ry="2" stroke={color} strokeWidth="2" fill="none"/>
    <Line x1="1" y1="10" x2="23" y2="10" stroke={color} strokeWidth="2"/>
  </Svg>
);

export const ChevronForwardIcon: React.FC<IconProps> = ({ size = 24, color = '#9E9E9E' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2" fill="none"/>
  </Svg>
);

export const BulkOperationsIcon: React.FC<IconProps> = ({ size = 24, color = '#FF6B35' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="bulkOperationsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FF8A65" />
        <Stop offset="100%" stopColor="#FF6B35" />
      </LinearGradient>
    </Defs>
    {/* Multiple checkboxes representing bulk selection */}
    <Rect x="3" y="3" width="6" height="6" rx="1" stroke="url(#bulkOperationsGradient)" strokeWidth="2" fill="none"/>
    <Path d="M5 6l1 1 2-2" stroke="url(#bulkOperationsGradient)" strokeWidth="2" fill="none"/>
    
    <Rect x="3" y="11" width="6" height="6" rx="1" stroke="url(#bulkOperationsGradient)" strokeWidth="2" fill="none"/>
    <Path d="M5 14l1 1 2-2" stroke="url(#bulkOperationsGradient)" strokeWidth="2" fill="none"/>
    
    <Rect x="11" y="3" width="6" height="6" rx="1" stroke="url(#bulkOperationsGradient)" strokeWidth="2" fill="none"/>
    <Path d="M13 6l1 1 2-2" stroke="url(#bulkOperationsGradient)" strokeWidth="2" fill="none"/>
    
    <Rect x="11" y="11" width="6" height="6" rx="1" stroke="url(#bulkOperationsGradient)" strokeWidth="2" fill="none"/>
    <Path d="M13 14l1 1 2-2" stroke="url(#bulkOperationsGradient)" strokeWidth="2" fill="none"/>
    
    {/* Action arrows */}
    <Path d="M19 8h3" stroke="url(#bulkOperationsGradient)" strokeWidth="2"/>
    <Path d="M20 6l2 2-2 2" stroke="url(#bulkOperationsGradient)" strokeWidth="2" fill="none"/>
  </Svg>
);

export const CategoryManagementIcon: React.FC<IconProps> = ({ size = 24, color = '#FF6B35' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="categoryManagementGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FF8A65" />
        <Stop offset="100%" stopColor="#FF6B35" />
      </LinearGradient>
    </Defs>
    {/* Folder structure representing categories */}
    <Path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" stroke="url(#categoryManagementGradient)" strokeWidth="2" fill="none"/>
    
    {/* Settings gear overlay */}
    <Circle cx="18" cy="15" r="3" stroke="url(#categoryManagementGradient)" strokeWidth="2" fill="none"/>
    <Path d="M18 12v6" stroke="url(#categoryManagementGradient)" strokeWidth="1.5"/>
    <Path d="M15.5 15h5" stroke="url(#categoryManagementGradient)" strokeWidth="1.5"/>
    <Path d="M16.5 13.5l3 3" stroke="url(#categoryManagementGradient)" strokeWidth="1.5"/>
    <Path d="M16.5 16.5l3-3" stroke="url(#categoryManagementGradient)" strokeWidth="1.5"/>
  </Svg>
);
