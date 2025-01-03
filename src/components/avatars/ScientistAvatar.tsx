import React from 'react';
import Svg, { Circle, Path, G, Rect } from 'react-native-svg';
import { ViewStyle } from 'react-native';

interface ScientistAvatarProps {
  size?: number;
  style?: ViewStyle;
}

export const ScientistAvatar: React.FC<ScientistAvatarProps> = ({ size = 100, style }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
      {/* Background */}
      <Circle cx="50" cy="50" r="50" fill="#3498DB" />
      
      {/* Lab Coat */}
      <Path
        d="M25 45 L30 85 L70 85 L75 45"
        fill="#FFFFFF"
      />
      <Path
        d="M35 45 L40 85 M65 45 L60 85"
        stroke="#ECF0F1"
        strokeWidth="2"
      />
      
      {/* Head */}
      <Circle cx="50" cy="40" r="25" fill="#FDEBD0" />
      
      {/* Crazy Hair */}
      <Path
        d="M25 40 Q35 20 50 25 Q65 20 75 40"
        fill="#7F8C8D"
      />
      <G>
        <Path
          d="M30 35 Q25 25 30 15"
          stroke="#7F8C8D"
          strokeWidth="4"
          fill="none"
        />
        <Path
          d="M70 35 Q75 25 70 15"
          stroke="#7F8C8D"
          strokeWidth="4"
          fill="none"
        />
      </G>
      
      {/* Goggles */}
      <G transform="translate(35, 35)">
        <Circle cx="0" cy="0" r="8" fill="#2C3E50" />
        <Circle cx="30" cy="0" r="8" fill="#2C3E50" />
        <Path
          d="M8 0 L22 0"
          stroke="#2C3E50"
          strokeWidth="2"
        />
        {/* Goggle Shine */}
        <Circle cx="2" cy="-2" r="3" fill="#3498DB" opacity="0.5" />
        <Circle cx="32" cy="-2" r="3" fill="#3498DB" opacity="0.5" />
      </G>
      
      {/* Bubbling Potions */}
      <G transform="translate(25, 70)">
        <Rect x="0" y="0" width="10" height="15" fill="#9B59B6" />
        <Circle cx="5" cy="-2" r="3" fill="#9B59B6" />
        <Circle cx="8" cy="-4" r="2" fill="#9B59B6" />
      </G>
      <G transform="translate(65, 70)">
        <Rect x="0" y="0" width="10" height="15" fill="#2ECC71" />
        <Circle cx="5" cy="-2" r="3" fill="#2ECC71" />
        <Circle cx="2" cy="-4" r="2" fill="#2ECC71" />
      </G>
      
      {/* Steam/Bubbles */}
      <G>
        <Path
          d="M30 60 Q35 55 30 50"
          stroke="#BDC3C7"
          strokeWidth="1"
          fill="none"
        />
        <Path
          d="M70 60 Q65 55 70 50"
          stroke="#BDC3C7"
          strokeWidth="1"
          fill="none"
        />
      </G>
    </Svg>
  );
};
