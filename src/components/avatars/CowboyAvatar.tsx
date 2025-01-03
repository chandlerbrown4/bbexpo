import React from 'react';
import Svg, { Circle, Path, G } from 'react-native-svg';
import { ViewStyle } from 'react-native';

interface CowboyAvatarProps {
  size?: number;
  style?: ViewStyle;
}

export const CowboyAvatar: React.FC<CowboyAvatarProps> = ({ size = 100, style }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
      {/* Background */}
      <Circle cx="50" cy="50" r="50" fill="#D35400" />
      
      {/* Cowboy Hat */}
      <Path
        d="M20 40 L80 40 L75 35 L25 35 Z"
        fill="#8B4513"
      />
      <Path
        d="M30 35 Q50 25 70 35"
        fill="#A0522D"
      />
      <Path
        d="M25 40 L30 42 L70 42 L75 40"
        fill="#6B3410"
      />
      
      {/* Hat Band */}
      <Path
        d="M30 35 Q50 33 70 35"
        stroke="#F1C40F"
        strokeWidth="2"
      />
      <Circle cx="50" cy="34" r="2" fill="#F1C40F" />
      
      {/* Face */}
      <Circle cx="50" cy="55" r="25" fill="#FDEBD0" />
      
      {/* Bandana */}
      <Path
        d="M35 65 L45 60 L55 60 L65 65"
        fill="#E74C3C"
      />
      <Path
        d="M45 60 L50 65 L55 60"
        fill="#C0392B"
      />
      
      {/* Eyes */}
      <G transform="translate(40, 50)">
        <Path
          d="M-2 0 L2 0"
          stroke="#2C3E50"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <Path
          d="M18 0 L22 0"
          stroke="#2C3E50"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </G>
      
      {/* Stubble */}
      <G>
        <Circle cx="45" cy="60" r="0.5" fill="#95A5A6" />
        <Circle cx="50" cy="62" r="0.5" fill="#95A5A6" />
        <Circle cx="55" cy="60" r="0.5" fill="#95A5A6" />
        <Circle cx="42" cy="58" r="0.5" fill="#95A5A6" />
        <Circle cx="58" cy="58" r="0.5" fill="#95A5A6" />
      </G>
      
      {/* Sheriff Badge */}
      <G transform="translate(30, 70)">
        <Path
          d="M0 0 L4 6 L0 12 L-4 6 Z"
          fill="#F1C40F"
        />
        <Circle cx="0" cy="6" r="2" fill="#F39C12" />
      </G>
      
      {/* Rope Detail */}
      <Path
        d="M70 70 Q75 65 80 70"
        stroke="#8B4513"
        strokeWidth="2"
        fill="none"
      />
      
      {/* Toothpick */}
      <Path
        d="M60 58 L65 57"
        stroke="#8B4513"
        strokeWidth="1"
      />
    </Svg>
  );
};
