import React from 'react';
import Svg, { Circle, Path, G } from 'react-native-svg';
import { ViewStyle } from 'react-native';

interface BearAvatarProps {
  size?: number;
  style?: ViewStyle;
}

export const BearAvatar: React.FC<BearAvatarProps> = ({ size = 100, style }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
      {/* Background Circle */}
      <Circle cx="50" cy="50" r="50" fill="#8E6E5D" />
      
      {/* Face */}
      <Circle cx="50" cy="50" r="40" fill="#A67C52" />
      
      {/* Ears */}
      <Circle cx="25" cy="25" r="12" fill="#8E6E5D" />
      <Circle cx="75" cy="25" r="12" fill="#8E6E5D" />
      <Circle cx="25" cy="25" r="8" fill="#6D4C41" />
      <Circle cx="75" cy="25" r="8" fill="#6D4C41" />
      
      {/* Eyes */}
      <G transform="translate(35, 40)">
        <Circle cx="0" cy="0" r="5" fill="#4A4A4A" />
        <Circle cx="30" cy="0" r="5" fill="#4A4A4A" />
        {/* Eye shine */}
        <Circle cx="2" cy="-2" r="2" fill="#FFFFFF" />
        <Circle cx="32" cy="-2" r="2" fill="#FFFFFF" />
      </G>
      
      {/* Nose */}
      <Circle cx="50" cy="50" r="8" fill="#4A4A4A" />
      
      {/* Mouth */}
      <Path
        d="M40 60 Q50 65 60 60"
        stroke="#4A4A4A"
        strokeWidth="2"
        fill="none"
      />
      
      {/* Cocktail Glass */}
      <G transform="translate(75, 70)">
        {/* Glass */}
        <Path
          d="M0 0 L-8 -15 L8 -15 Z"
          fill="#E0E0E0"
          opacity="0.8"
        />
        {/* Liquid */}
        <Path
          d="M-6 -13 L6 -13 L3 -5 L-3 -5 Z"
          fill="#FF4081"
        />
        {/* Straw */}
        <Path
          d="M0 -15 L5 -20"
          stroke="#FFC107"
          strokeWidth="1.5"
        />
        {/* Cherry */}
        <Circle cx="5" cy="-20" r="2" fill="#E53935" />
      </G>
    </Svg>
  );
};
