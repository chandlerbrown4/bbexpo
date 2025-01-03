import React from 'react';
import Svg, { Circle, Path, G, Rect } from 'react-native-svg';
import { ViewStyle } from 'react-native';

interface AstronautAvatarProps {
  size?: number;
  style?: ViewStyle;
}

export const AstronautAvatar: React.FC<AstronautAvatarProps> = ({ size = 100, style }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
      {/* Background */}
      <Circle cx="50" cy="50" r="50" fill="#2C3E50" />
      
      {/* Helmet */}
      <Circle cx="50" cy="50" r="35" fill="#ECF0F1" />
      <Path
        d="M20 50 A30 30 0 0 1 80 50"
        fill="#BDC3C7"
        opacity="0.3"
      />
      
      {/* Visor */}
      <Path
        d="M25 45 A25 25 0 0 1 75 45"
        fill="#3498DB"
        opacity="0.7"
      />
      
      {/* Helmet Reflection */}
      <Path
        d="M30 35 L35 30 L40 35"
        stroke="#FFFFFF"
        strokeWidth="2"
        fill="none"
        opacity="0.8"
      />
      
      {/* Space Suit */}
      <Path
        d="M15 70 Q50 85 85 70"
        fill="#95A5A6"
      />
      
      {/* Suit Details */}
      <G>
        <Circle cx="30" cy="75" r="5" fill="#7F8C8D" />
        <Circle cx="70" cy="75" r="5" fill="#7F8C8D" />
        <Rect x="45" y="70" width="10" height="15" fill="#7F8C8D" />
      </G>
      
      {/* NASA Logo */}
      <Circle cx="50" cy="80" r="3" fill="#E74C3C" />
      
      {/* Stars */}
      <G>
        <Circle cx="15" cy="15" r="1" fill="#FFFFFF" />
        <Circle cx="85" cy="15" r="1" fill="#FFFFFF" />
        <Circle cx="25" cy="25" r="1" fill="#FFFFFF" />
        <Circle cx="75" cy="25" r="1" fill="#FFFFFF" />
      </G>
    </Svg>
  );
};
