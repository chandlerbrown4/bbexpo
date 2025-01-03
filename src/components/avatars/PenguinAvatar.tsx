import React from 'react';
import Svg, { Circle, Path, G, Rect } from 'react-native-svg';
import { ViewStyle } from 'react-native';

interface PenguinAvatarProps {
  size?: number;
  style?: ViewStyle;
}

export const PenguinAvatar: React.FC<PenguinAvatarProps> = ({ size = 100, style }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
      {/* Background Circle */}
      <Circle cx="50" cy="50" r="50" fill="#4A90E2" />
      
      {/* Body */}
      <Path
        d="M30 40 Q50 90 70 40"
        fill="#2C3E50"
      />
      
      {/* White Belly */}
      <Path
        d="M35 45 Q50 85 65 45"
        fill="#FFFFFF"
      />
      
      {/* Head */}
      <Circle cx="50" cy="35" r="25" fill="#2C3E50" />
      
      {/* Eyes */}
      <G transform="translate(40, 30)">
        <Circle cx="0" cy="0" r="4" fill="#FFFFFF" />
        <Circle cx="20" cy="0" r="4" fill="#FFFFFF" />
        <Circle cx="0" cy="0" r="2" fill="#000000" />
        <Circle cx="20" cy="0" r="2" fill="#000000" />
      </G>
      
      {/* Beak */}
      <Path
        d="M45 38 L55 38 L50 45 Z"
        fill="#F39C12"
      />
      
      {/* Bowtie */}
      <G transform="translate(50, 45)">
        <Path
          d="M-10 0 L-5 -5 L0 0 L5 -5 L10 0 L5 5 L0 0 L-5 5 Z"
          fill="#E74C3C"
        />
        <Circle cx="0" cy="0" r="2" fill="#C0392B" />
      </G>
      
      {/* Flippers */}
      <Path
        d="M25 50 Q20 60 25 70"
        stroke="#2C3E50"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <Path
        d="M75 50 Q80 60 75 70"
        stroke="#2C3E50"
        strokeWidth="8"
        strokeLinecap="round"
      />
    </Svg>
  );
};
