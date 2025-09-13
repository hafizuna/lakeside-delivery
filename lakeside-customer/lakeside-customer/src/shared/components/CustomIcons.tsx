import React from 'react';
import { Svg, Path, Circle, Ellipse, Rect, G, Defs, LinearGradient, Stop } from 'react-native-svg';

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
      d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"
      fill="url(#homeGradient)"
    />
    <Path
      d="M12 15.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"
      fill="#FFF"
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
    <Defs>
      <LinearGradient id="cartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FF8A65" />
        <Stop offset="100%" stopColor="#FF6B35" />
      </LinearGradient>
    </Defs>
    <Path
      d="M3 3h2l.4 2M7 13h10l4-8H5.4m1.6 8L5 4H2M7 13v4a2 2 0 002 2h8a2 2 0 002-2v-4M7 13L5.4 5"
      fill="none"
      stroke="url(#cartGradient)"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="9" cy="20" r="1" fill="url(#cartGradient)"/>
    <Circle cx="17" cy="20" r="1" fill="url(#cartGradient)"/>
    {count && count > 0 && (
      <>
        <Circle cx="19" cy="5" r="4" fill="#DC143C"/>
        <text x="19" y="7" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">
          {count > 99 ? '99+' : count}
        </text>
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
