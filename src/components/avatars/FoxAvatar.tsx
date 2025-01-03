import React from 'react';
import Svg, { Circle, Path, G } from 'react-native-svg';
import { ViewStyle } from 'react-native';

interface FoxAvatarProps {
  size?: number;
  style?: ViewStyle;
}

export const FoxAvatar: React.FC<FoxAvatarProps> = ({ size = 100, style }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
      {/* Background Circle */}
      <Circle cx="50" cy="50" r="50" fill="#FF5722" />
      
      {/* Face */}
      <Circle cx="50" cy="50" r="40" fill="#FF7043" />
      
      {/* Ears */}
      <Path
        d="M15 30 L35 45 L25 15 Z"
        fill="#FF5722"
      />
      <Path
        d="M85 30 L65 45 L75 15 Z"
        fill="#FF5722"
      />
      <Path
        d="M20 25 L32 40 L25 20 Z"
        fill="#FFFFFF"
        opacity="0.3"
      />
      <Path
        d="M80 25 L68 40 L75 20 Z"
        fill="#FFFFFF"
        opacity="0.3"
      />
      
      {/* Eyes */}
      <G transform="translate(35, 45)">
        <Circle cx="0" cy="0" r="5" fill="#4A4A4A" />
        <Circle cx="30" cy="0" r="5" fill="#4A4A4A" />
        {/* Eye shine */}
        <Circle cx="2" cy="-2" r="2" fill="#FFFFFF" />
        <Circle cx="32" cy="-2" r="2" fill="#FFFFFF" />
      </G>
      
      {/* Nose */}
      <Circle cx="50" cy="55" r="6" fill="#4A4A4A" />
      
      {/* Fancy Hat */}
      <G transform="translate(50, 20)">
        {/* Hat Base */}
        <Path
          d="M-20 0 C-20 -10 20 -10 20 0"
          fill="#2C3E50"
        />
        {/* Hat Top */}
        <Path
          d="M-15 0 L-10 -20 L10 -20 L15 0"
          fill="#2C3E50"
        />
        {/* Hat Band */}
        <Path
          d="M-15 -2 L15 -2"
          stroke="#E74C3C"
          strokeWidth="3"
        />
        {/* Feather */}
        <Path
          d="M10 -15 Q20 -25 15 -35"
          stroke="#E74C3C"
          strokeWidth="2"
          fill="none"
        />
      </G>
      
      {/* White fur patches */}
      <Path
        d="M40 65 Q50 75 60 65"
        fill="#FFFFFF"
      />
      <Path
        d="M45 60 L50 65 L55 60"
        fill="#FFFFFF"
      />
    </Svg>
  );
};
