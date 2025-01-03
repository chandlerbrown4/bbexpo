import React from 'react';
import Svg, { Circle, Path, G } from 'react-native-svg';
import { ViewStyle } from 'react-native';

interface SuperheroAvatarProps {
  size?: number;
  style?: ViewStyle;
}

export const SuperheroAvatar: React.FC<SuperheroAvatarProps> = ({ size = 100, style }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
      {/* Background */}
      <Circle cx="50" cy="50" r="50" fill="#3498DB" />
      
      {/* Cape */}
      <Path
        d="M20 40 Q50 100 80 40"
        fill="#E74C3C"
      />
      
      {/* Body */}
      <Path
        d="M35 45 Q50 55 65 45 Q65 75 50 80 Q35 75 35 45"
        fill="#2980B9"
      />
      
      {/* Chest Emblem */}
      <Path
        d="M45 55 L50 45 L55 55 L50 65 Z"
        fill="#F1C40F"
      />
      
      {/* Head */}
      <Circle cx="50" cy="35" r="20" fill="#E67E22" />
      
      {/* Mask */}
      <Path
        d="M30 35 Q50 45 70 35"
        fill="#2C3E50"
      />
      <Path
        d="M35 25 L45 35 L35 35 Z"
        fill="#2C3E50"
      />
      <Path
        d="M65 25 L55 35 L65 35 Z"
        fill="#2C3E50"
      />
      
      {/* Eyes */}
      <G transform="translate(40, 32)">
        <Circle cx="0" cy="0" r="3" fill="#FFFFFF" />
        <Circle cx="20" cy="0" r="3" fill="#FFFFFF" />
      </G>
      
      {/* Determined Expression */}
      <Path
        d="M45 40 L55 40"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
      />
      
      {/* Wind Effect */}
      <G>
        <Path
          d="M15 20 Q20 20 25 15"
          stroke="#E74C3C"
          strokeWidth="2"
          fill="none"
          opacity="0.5"
        />
        <Path
          d="M10 30 Q15 30 20 25"
          stroke="#E74C3C"
          strokeWidth="2"
          fill="none"
          opacity="0.5"
        />
        <Path
          d="M85 20 Q80 20 75 15"
          stroke="#E74C3C"
          strokeWidth="2"
          fill="none"
          opacity="0.5"
        />
      </G>
    </Svg>
  );
};
