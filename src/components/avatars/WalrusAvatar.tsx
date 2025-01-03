import React from 'react';
import Svg, { Circle, Path, G } from 'react-native-svg';
import { ViewStyle } from 'react-native';

interface WalrusAvatarProps {
  size?: number;
  style?: ViewStyle;
}

export const WalrusAvatar: React.FC<WalrusAvatarProps> = ({ size = 100, style }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
      {/* Background Circle */}
      <Circle cx="50" cy="50" r="50" fill="#B87D5E" />
      
      {/* Face */}
      <Circle cx="50" cy="50" r="40" fill="#D4A684" />
      
      {/* Eyes */}
      <G transform="translate(30, 35)">
        <Circle cx="0" cy="0" r="5" fill="#4A4A4A" />
        <Circle cx="40" cy="0" r="5" fill="#4A4A4A" />
        {/* Eye shine */}
        <Circle cx="2" cy="-2" r="2" fill="#FFFFFF" />
        <Circle cx="42" cy="-2" r="2" fill="#FFFFFF" />
      </G>
      
      {/* Nose */}
      <Circle cx="50" cy="45" r="8" fill="#9E6B4E" />
      
      {/* Whiskers */}
      <G stroke="#8B5E3C" strokeWidth="2">
        {/* Left whiskers */}
        <Path d="M30 50 L15 45" />
        <Path d="M30 50 L15 50" />
        <Path d="M30 50 L15 55" />
        
        {/* Right whiskers */}
        <Path d="M70 50 L85 45" />
        <Path d="M70 50 L85 50" />
        <Path d="M70 50 L85 55" />
      </G>
      
      {/* Tusks */}
      <Path
        d="M40 55 Q35 75 45 80 L45 80 Q40 75 45 55"
        fill="#F5F5F5"
      />
      <Path
        d="M60 55 Q65 75 55 80 L55 80 Q60 75 55 55"
        fill="#F5F5F5"
      />
      
      {/* Mouth */}
      <Path
        d="M35 60 Q50 70 65 60"
        stroke="#8B5E3C"
        strokeWidth="2"
        fill="none"
      />
    </Svg>
  );
};
