import React from 'react';
import { View, Text } from 'react-native';
import { Svg, Path, Circle, Ellipse, Rect, G, Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

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

export const BurgerIcon: React.FC<IconProps> = ({ size = 24, color = '#FF6B35' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="burgerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFB74D" />
        <Stop offset="50%" stopColor="#FF8A50" />
        <Stop offset="100%" stopColor="#FF6B35" />
      </LinearGradient>
    </Defs>
    {/* Top bun */}
    <Ellipse cx="12" cy="7" rx="9" ry="3" fill="url(#burgerGradient)" />
    {/* Lettuce */}
    <Ellipse cx="12" cy="10" rx="8" ry="1.5" fill="#4CAF50" />
    {/* Patty */}
    <Ellipse cx="12" cy="13" rx="7.5" ry="2" fill="#8D4E2A" />
    {/* Cheese */}
    <Ellipse cx="12" cy="15.5" rx="8.5" ry="1" fill="#FFC107" />
    {/* Bottom bun */}
    <Ellipse cx="12" cy="18" rx="9" ry="2.5" fill="#D2691E" />
    {/* Sesame seeds */}
    <Circle cx="9" cy="6.5" r="0.5" fill="#FFF8DC" />
    <Circle cx="12" cy="6" r="0.5" fill="#FFF8DC" />
    <Circle cx="15" cy="6.5" r="0.5" fill="#FFF8DC" />
  </Svg>
);

export const PizzaIcon: React.FC<IconProps> = ({ size = 24, color = '#FF6B35' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="pizzaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFD54F" />
        <Stop offset="100%" stopColor="#FF8F00" />
      </LinearGradient>
    </Defs>
    {/* Pizza slice base */}
    <Path
      d="M12 2L4 20h16L12 2z"
      fill="url(#pizzaGradient)"
      stroke="#D4AF37"
      strokeWidth="1"
    />
    {/* Cheese */}
    <Path
      d="M12 4L5.5 18h13L12 4z"
      fill="#FFF8DC"
      opacity="0.8"
    />
    {/* Pepperoni */}
    <Circle cx="10" cy="8" r="1.2" fill="#DC143C" />
    <Circle cx="13" cy="10" r="1.2" fill="#DC143C" />
    <Circle cx="9" cy="12" r="1.2" fill="#DC143C" />
    <Circle cx="14" cy="14" r="1.2" fill="#DC143C" />
    {/* Oregano */}
    <Circle cx="11" cy="6" r="0.3" fill="#228B22" />
    <Circle cx="12.5" cy="7.5" r="0.3" fill="#228B22" />
    <Circle cx="10.5" cy="10" r="0.3" fill="#228B22" />
  </Svg>
);

export const SushiIcon: React.FC<IconProps> = ({ size = 24, color = '#FF6B35' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="sushiGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFF" />
        <Stop offset="100%" stopColor="#F5F5F5" />
      </LinearGradient>
    </Defs>
    {/* Rice base */}
    <Ellipse cx="12" cy="16" rx="10" ry="6" fill="url(#sushiGradient)" stroke="#E0E0E0" strokeWidth="1"/>
    {/* Salmon */}
    <Ellipse cx="12" cy="10" rx="9" ry="4" fill="#FF6B47"/>
    {/* Avocado */}
    <Ellipse cx="12" cy="8" rx="7" ry="2" fill="#7CB342"/>
    {/* Nori wrap */}
    <Rect x="2" y="14" width="20" height="3" rx="1.5" fill="#2E7D32"/>
  </Svg>
);

export const CoffeeIcon: React.FC<IconProps> = ({ size = 24, color = '#FF6B35' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="coffeeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#8D4E2A" />
        <Stop offset="100%" stopColor="#5D4E37" />
      </LinearGradient>
    </Defs>
    {/* Cup */}
    <Path
      d="M6 10v8a3 3 0 003 3h6a3 3 0 003-3v-8"
      fill="url(#coffeeGradient)"
    />
    {/* Coffee surface */}
    <Ellipse cx="12" cy="10" rx="6" ry="1" fill="#3E2723"/>
    {/* Handle */}
    <Path
      d="M18 12v4a2 2 0 002-2v-2a2 2 0 00-2 0"
      fill="none"
      stroke="#8D4E2A"
      strokeWidth="2"
    />
    {/* Steam */}
    <Path d="M9 4c0 1-1 1-1 2s1 1 1 2" stroke="#B0BEC5" strokeWidth="2" strokeLinecap="round"/>
    <Path d="M12 3c0 1-1 1-1 2s1 1 1 2" stroke="#B0BEC5" strokeWidth="2" strokeLinecap="round"/>
    <Path d="M15 4c0 1-1 1-1 2s1 1 1 2" stroke="#B0BEC5" strokeWidth="2" strokeLinecap="round"/>
  </Svg>
);

export const IceCreamIcon: React.FC<IconProps> = ({ size = 24, color = '#FF6B35' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="iceCreamGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFB3E6" />
        <Stop offset="50%" stopColor="#FF8FAB" />
        <Stop offset="100%" stopColor="#FF6B9D" />
      </LinearGradient>
    </Defs>
    {/* Cone */}
    <Path
      d="M12 14L9 20h6l-3-6z"
      fill="#D2B48C"
      stroke="#CD853F"
      strokeWidth="1"
    />
    {/* Ice cream scoops */}
    <Circle cx="12" cy="12" r="3" fill="url(#iceCreamGradient)"/>
    <Circle cx="12" cy="8" r="2.5" fill="#87CEEB"/>
    <Circle cx="12" cy="5" r="2" fill="#FFE4B5"/>
    {/* Cherry on top */}
    <Circle cx="12" cy="3" r="1" fill="#DC143C"/>
    <Path d="M12 2c0-1 1-1 1-1" stroke="#228B22" strokeWidth="1"/>
  </Svg>
);

// Functional Icons
export const SearchIcon: React.FC<IconProps> = ({ size = 24, color = '#FF6B35' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="searchGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FF8A65" />
        <Stop offset="100%" stopColor="#FF6B35" />
      </LinearGradient>
    </Defs>
    <Circle
      cx="11"
      cy="11"
      r="6"
      fill="none"
      stroke="url(#searchGradient)"
      strokeWidth="2.5"
    />
    <Path
      d="m21 21-4.35-4.35"
      stroke="url(#searchGradient)"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
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
    <Path
      d="M3 6h18M7 12h10M11 18h2"
      stroke="url(#filterGradient)"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <Circle cx="5" cy="6" r="2" fill="url(#filterGradient)"/>
    <Circle cx="15" cy="12" r="2" fill="url(#filterGradient)"/>
    <Circle cx="12" cy="18" r="2" fill="url(#filterGradient)"/>
  </Svg>
);

export const CartIcon: React.FC<IconProps & { count?: number }> = ({ size = 24, color = '#FF6B35', count }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 3h2l.4 2M7 13h10l4-8H5.4m1.6 8L5 4H2M7 13v4a2 2 0 002 2h8a2 2 0 002-2v-4M7 13L5.4 5"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="9" cy="20" r="1" fill={color}/>
    <Circle cx="17" cy="20" r="1" fill={color}/>
    {count && count > 0 && (
      <>
        <Circle cx="19" cy="5" r="4" fill="#DC143C"/>
        <SvgText x="19" y="8" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">
          {count > 99 ? '99+' : String(count)}
        </SvgText>
      </>
    )}
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

// Additional Custom Icons for Other Screens

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

export const PlusIcon: React.FC<IconProps> = ({ size = 24, color = '#FF6B35' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="plusGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FF8A65" />
        <Stop offset="100%" stopColor="#FF6B35" />
      </LinearGradient>
    </Defs>
    <Circle cx="12" cy="12" r="10" fill="url(#plusGradient)"/>
    <Path d="M12 8v8M8 12h8" stroke="white" strokeWidth="2" strokeLinecap="round"/>
  </Svg>
);

export const MinusIcon: React.FC<IconProps> = ({ size = 24, color = '#FF6B35' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="minusGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FF8A65" />
        <Stop offset="100%" stopColor="#FF6B35" />
      </LinearGradient>
    </Defs>
    <Circle cx="12" cy="12" r="10" fill="url(#minusGradient)"/>
    <Path d="M8 12h8" stroke="white" strokeWidth="2" strokeLinecap="round"/>
  </Svg>
);

export const TrashIcon: React.FC<IconProps> = ({ size = 24, color = '#F44336' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="trashGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#F44336" />
        <Stop offset="100%" stopColor="#D32F2F" />
      </LinearGradient>
    </Defs>
    <Path
      d="M3 6h18m-2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"
      fill="none"
      stroke="url(#trashGradient)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M10 11v6M14 11v6"
      stroke="url(#trashGradient)"
      strokeWidth="2"
      strokeLinecap="round"
    />
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

export const ClockIcon: React.FC<IconProps> = ({ size = 24, color = '#FF6B35' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="clockGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FF8A65" />
        <Stop offset="100%" stopColor="#FF6B35" />
      </LinearGradient>
    </Defs>
    <Circle cx="12" cy="12" r="10" fill="none" stroke="url(#clockGradient)" strokeWidth="2"/>
    <Path d="M12 6v6l4 2" stroke="url(#clockGradient)" strokeWidth="2" strokeLinecap="round"/>
  </Svg>
);

export const CreditCardIcon: React.FC<IconProps> = ({ size = 24, color = '#FF6B35' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="cardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#4CAF50" />
        <Stop offset="100%" stopColor="#2E7D32" />
      </LinearGradient>
    </Defs>
    <Rect x="1" y="4" width="22" height="16" rx="4" fill="url(#cardGradient)"/>
    <Path d="M1 10h22" stroke="white" strokeWidth="2"/>
    <Path d="M7 15h.01M11 15h2" stroke="white" strokeWidth="2" strokeLinecap="round"/>
  </Svg>
);

export const CashIcon: React.FC<IconProps> = ({ size = 24, color = '#FF6B35' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="cashGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#4CAF50" />
        <Stop offset="100%" stopColor="#2E7D32" />
      </LinearGradient>
    </Defs>
    <Rect x="2" y="7" width="20" height="10" rx="2" fill="url(#cashGradient)"/>
    <Circle cx="12" cy="12" r="2" fill="white"/>
    <Path d="M6 7v-1a2 2 0 012-2h8a2 2 0 012 2v1M6 17v1a2 2 0 002 2h8a2 2 0 002-2v-1" 
      stroke="url(#cashGradient)" strokeWidth="2"/>
  </Svg>
);

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

export const GiftIcon: React.FC<IconProps> = ({ size = 24, color = '#FF6B35' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="giftGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFB74D" />
        <Stop offset="100%" stopColor="#FF8F00" />
      </LinearGradient>
    </Defs>
    <Rect x="3" y="8" width="18" height="4" rx="1" fill="url(#giftGradient)"/>
    <Rect x="4" y="12" width="16" height="10" rx="1" fill="url(#giftGradient)" opacity="0.8"/>
    <Path d="M12 8V2a2 2 0 00-2-2 2 2 0 00-2 2 2 2 0 002 2h2zM12 8V2a2 2 0 012-2 2 2 0 012 2 2 2 0 01-2 2h-2z" 
      stroke="url(#giftGradient)" strokeWidth="2" fill="none"/>
    <Path d="M12 8v14" stroke="white" strokeWidth="2"/>
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
    <Circle cx="12" cy="12" r="3" stroke="url(#settingsGradient)" strokeWidth="2" fill="none"/>
    <Path d="M12 1v6m0 8v6M4.22 4.22l4.24 4.24m8.48 8.48l4.24 4.24M1 12h6m8 0h6M4.22 19.78l4.24-4.24m8.48-8.48l4.24-4.24" 
      stroke="url(#settingsGradient)" strokeWidth="2" strokeLinecap="round"/>
  </Svg>
);

export const ShieldIcon: React.FC<IconProps> = ({ size = 24, color = '#FF6B35' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#4CAF50" />
        <Stop offset="100%" stopColor="#2E7D32" />
      </LinearGradient>
    </Defs>
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="url(#shieldGradient)"/>
    <Path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export const HelpIcon: React.FC<IconProps> = ({ size = 24, color = '#FF6B35' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="helpGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#2196F3" />
        <Stop offset="100%" stopColor="#1976D2" />
      </LinearGradient>
    </Defs>
    <Circle cx="12" cy="12" r="10" fill="url(#helpGradient)"/>
    <Path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" stroke="white" strokeWidth="2" 
      strokeLinecap="round" strokeLinejoin="round"/>
    <Circle cx="12" cy="17" r="1" fill="white"/>
  </Svg>
);

export const BellIcon: React.FC<IconProps> = ({ size = 24, color = '#FF6B35' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="bellGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FF8A65" />
        <Stop offset="100%" stopColor="#FF6B35" />
      </LinearGradient>
    </Defs>
    <Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9z" fill="url(#bellGradient)"/>
    <Path d="M13.73 21a2 2 0 01-3.46 0" stroke="url(#bellGradient)" strokeWidth="2" 
      strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export const AlertIcon: React.FC<IconProps> = ({ size = 24, color = '#FFA726' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="alertGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFA726" />
        <Stop offset="100%" stopColor="#FF8F00" />
      </LinearGradient>
    </Defs>
    <Path
      d="M12 2L1 21h22L12 2z"
      fill="url(#alertGradient)"
    />
    <Path
      d="M12 9v4M12 17h.01"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const LogoutIcon: React.FC<IconProps> = ({ size = 24, color = '#F44336' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="logoutGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#F44336" />
        <Stop offset="100%" stopColor="#D32F2F" />
      </LinearGradient>
    </Defs>
    <Path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" 
      stroke="url(#logoutGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
    <Path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" 
      stroke="url(#editGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <Path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" 
      fill="url(#editGradient)"/>
  </Svg>
);

// Payment Method Icons
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

export const UpiIcon: React.FC<IconProps> = ({ size = 24, color = '#FF6B35' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="upiGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#2196F3" />
        <Stop offset="100%" stopColor="#1976D2" />
      </LinearGradient>
    </Defs>
    <Rect x="4" y="3" width="16" height="18" rx="3" fill="url(#upiGradient)"/>
    <Rect x="6" y="5" width="12" height="14" rx="1" fill="white"/>
    <Circle cx="12" cy="10" r="2" fill="url(#upiGradient)"/>
    <Path d="M8 14h8M10 16h4" stroke="url(#upiGradient)" strokeWidth="1.5" strokeLinecap="round"/>
    <Rect x="11" y="20" width="2" height="1" rx="0.5" fill="#666"/>
  </Svg>
);

export const NetBankingIcon: React.FC<IconProps> = ({ size = 24, color = '#FF6B35' }) => (
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

export const AddCardIcon: React.FC<IconProps> = ({ size = 24, color = '#FF6B35' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="addCardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FF8A65" />
        <Stop offset="100%" stopColor="#FF6B35" />
      </LinearGradient>
    </Defs>
    <Rect x="1" y="4" width="18" height="12" rx="3" fill="none" stroke="url(#addCardGradient)" strokeWidth="2" strokeDasharray="2,2"/>
    <Circle cx="21" cy="3" r="2" fill="url(#addCardGradient)"/>
    <Path d="M20 3h2M21 2v2" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    <Path d="M5 10h8" stroke="url(#addCardGradient)" strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

export const SecurityIcon: React.FC<IconProps> = ({ size = 24, color = '#FF6B35' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="securityGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#4CAF50" />
        <Stop offset="100%" stopColor="#2E7D32" />
      </LinearGradient>
    </Defs>
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="url(#securityGradient)"/>
    <Path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <Circle cx="12" cy="12" r="1" fill="white"/>
  </Svg>
);

export const TransactionIcon: React.FC<IconProps> = ({ size = 24, color = '#FF6B35' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="transactionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#2196F3" />
        <Stop offset="100%" stopColor="#1976D2" />
      </LinearGradient>
    </Defs>
    <Circle cx="12" cy="12" r="10" fill="url(#transactionGradient)"/>
    <Path d="M8 12h8M12 8l4 4-4 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <Circle cx="8" cy="12" r="1" fill="white"/>
  </Svg>
);

export const ArrowUpIcon: React.FC<IconProps> = ({ size = 24, color = '#4CAF50' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="arrowUpGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#4CAF50" />
        <Stop offset="100%" stopColor="#2E7D32" />
      </LinearGradient>
    </Defs>
    <Circle cx="12" cy="12" r="10" fill="url(#arrowUpGradient)"/>
    <Path d="M12 8l-4 4h8l-4-4z" fill="white"/>
    <Path d="M12 8v8" stroke="white" strokeWidth="2" strokeLinecap="round"/>
  </Svg>
);

export const ArrowDownIcon: React.FC<IconProps> = ({ size = 24, color = '#F44336' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="arrowDownGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#F44336" />
        <Stop offset="100%" stopColor="#D32F2F" />
      </LinearGradient>
    </Defs>
    <Circle cx="12" cy="12" r="10" fill="url(#arrowDownGradient)"/>
    <Path d="M12 16l4-4H8l4 4z" fill="white"/>
    <Path d="M12 16V8" stroke="white" strokeWidth="2" strokeLinecap="round"/>
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

export const ImageIcon: React.FC<IconProps> = ({ size = 24, color = '#FF6B35' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="imageGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FF8A65" />
        <Stop offset="100%" stopColor="#FF6B35" />
      </LinearGradient>
    </Defs>
    <Rect x="3" y="3" width="18" height="18" rx="2" ry="2" fill="none" stroke="url(#imageGradient)" strokeWidth="2"/>
    <Circle cx="8.5" cy="8.5" r="1.5" fill="url(#imageGradient)"/>
    <Path d="M21 15l-5-5L5 21" stroke="url(#imageGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export const WorkIcon: React.FC<IconProps> = ({ size = 24, color = '#FF6B35' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="workGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#2196F3" />
        <Stop offset="100%" stopColor="#1976D2" />
      </LinearGradient>
    </Defs>
    <Rect x="2" y="7" width="20" height="14" rx="2" ry="2" fill="url(#workGradient)"/>
    <Path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" fill="none" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <Circle cx="12" cy="14" r="2" fill="#FFF"/>
    <Path d="M7 11h10" stroke="#FFF" strokeWidth="1" strokeLinecap="round"/>
    <Path d="M7 17h10" stroke="#FFF" strokeWidth="1" strokeLinecap="round"/>
  </Svg>
);

export const LocationIcon: React.FC<IconProps> = ({ size = 24, color = '#FF6B35' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="locationGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FF8A65" />
        <Stop offset="100%" stopColor={color} />
      </LinearGradient>
    </Defs>
    <Path
      d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"
      fill="url(#locationGradient)"
    />
    <Circle cx="12" cy="10" r="3" fill="#FFF"/>
  </Svg>
);
