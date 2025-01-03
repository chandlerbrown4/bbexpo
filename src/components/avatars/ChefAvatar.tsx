import React from 'react';
import Svg, { Circle, Path, G, Rect } from 'react-native-svg';
import { ViewStyle } from 'react-native';

interface ChefAvatarProps {
  size?: number;
  style?: ViewStyle;
}

export const ChefAvatar: React.FC<ChefAvatarProps> = ({ size = 100, style }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
      {/* Background */}
      <Circle cx="50" cy="50" r="50" fill="#E67E22" />
      
      {/* Chef Hat */}
      <Path
        d="M30 40 Q30 20 50 20 Q70 20 70 40"
        fill="#FFFFFF"
      />
      <Path
        d="M25 40 H75"
        stroke="#FFFFFF"
        strokeWidth="10"
      />
      
      {/* Face */}
      <Circle cx="50" cy="55" r="25" fill="#FDEBD0" />
      
      {/* Eyes */}
      <G transform="translate(40, 50)">
        <Circle cx="0" cy="0" r="3" fill="#2C3E50" />
        <Circle cx="20" cy="0" r="3" fill="#2C3E50" />
        {/* Eyebrows */}
        <Path
          d="M-5 -5 L5 -5"
          stroke="#2C3E50"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <Path
          d="M15 -5 L25 -5"
          stroke="#2C3E50"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </G>
      
      {/* Mustache */}
      <Path
        d="M40 60 Q50 65 60 60"
        stroke="#2C3E50"
        strokeWidth="2"
        fill="none"
      />
      
      {/* Neck Tie */}
      <G transform="translate(50, 75)">
        <Path
          d="M-5 0 L0 10 L5 0"
          fill="#E74C3C"
        />
        <Path
          d="M-2 -5 L2 -5"
          stroke="#E74C3C"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </G>
      
      {/* Steam */}
      <G>
        <Path
          d="M15 30 Q20 25 15 20"
          stroke="#FFFFFF"
          strokeWidth="2"
          fill="none"
          opacity="0.6"
        />
        <Path
          d="M85 30 Q80 25 85 20"
          stroke="#FFFFFF"
          strokeWidth="2"
          fill="none"
          opacity="0.6"
        />
      </G>
    </Svg>
  );
};
