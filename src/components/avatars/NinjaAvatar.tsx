import React from 'react';
import Svg, { Circle, Path, G } from 'react-native-svg';
import { ViewStyle } from 'react-native';

interface NinjaAvatarProps {
  size?: number;
  style?: ViewStyle;
}

export const NinjaAvatar: React.FC<NinjaAvatarProps> = ({ size = 100, style }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
      {/* Background */}
      <Circle cx="50" cy="50" r="50" fill="#34495E" />
      
      {/* Head */}
      <Circle cx="50" cy="50" r="35" fill="#2C3E50" />
      
      {/* Mask */}
      <Path
        d="M20 50 Q50 60 80 50"
        stroke="#95A5A6"
        strokeWidth="4"
        fill="none"
      />
      
      {/* Eyes */}
      <G transform="translate(35, 40)">
        <Path
          d="M0 0 L10 0"
          stroke="#FFFFFF"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <Path
          d="M20 0 L30 0"
          stroke="#FFFFFF"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </G>
      
      {/* Headband */}
      <Path
        d="M15 40 Q50 35 85 40"
        stroke="#E74C3C"
        strokeWidth="8"
        fill="none"
      />
      
      {/* Headband knot */}
      <G transform="translate(75, 40)">
        <Path
          d="M0 0 L10 -5 L15 5 L5 10 Z"
          fill="#E74C3C"
        />
        <Path
          d="M10 -5 L20 -15"
          stroke="#E74C3C"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <Path
          d="M15 5 L25 10"
          stroke="#E74C3C"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </G>
      
      {/* Shoulder details */}
      <Path
        d="M15 70 Q50 85 85 70"
        stroke="#2C3E50"
        strokeWidth="10"
        fill="none"
      />
    </Svg>
  );
};
