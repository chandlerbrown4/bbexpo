import React from 'react';
import Svg, { Circle, Path, G } from 'react-native-svg';
import { ViewStyle } from 'react-native';

interface JesterAvatarProps {
  size?: number;
  style?: ViewStyle;
}

export const JesterAvatar: React.FC<JesterAvatarProps> = ({ size = 100, style }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
      {/* Background */}
      <Circle cx="50" cy="50" r="50" fill="#8E44AD" />
      
      {/* Jester Hat */}
      <Path
        d="M20 40 Q35 20 50 40 Q65 20 80 40"
        fill="#E74C3C"
      />
      <Path
        d="M20 40 Q35 60 50 40 Q65 60 80 40"
        fill="#E67E22"
      />
      
      {/* Bells */}
      <G>
        <Circle cx="35" cy="25" r="5" fill="#F1C40F" />
        <Circle cx="35" cy="25" r="1" fill="#F39C12" />
        <Circle cx="65" cy="25" r="5" fill="#F1C40F" />
        <Circle cx="65" cy="25" r="1" fill="#F39C12" />
        <Circle cx="50" cy="45" r="5" fill="#F1C40F" />
        <Circle cx="50" cy="45" r="1" fill="#F39C12" />
      </G>
      
      {/* Face */}
      <Circle cx="50" cy="55" r="25" fill="#FDEBD0" />
      
      {/* Rosy Cheeks */}
      <Circle cx="35" cy="60" r="5" fill="#E74C3C" opacity="0.3" />
      <Circle cx="65" cy="60" r="5" fill="#E74C3C" opacity="0.3" />
      
      {/* Eyes */}
      <G transform="translate(40, 50)">
        <Circle cx="0" cy="0" r="5" fill="#2C3E50" />
        <Circle cx="20" cy="0" r="5" fill="#2C3E50" />
        {/* Twinkle */}
        <Circle cx="1" cy="-1" r="2" fill="#FFFFFF" />
        <Circle cx="21" cy="-1" r="2" fill="#FFFFFF" />
      </G>
      
      {/* Big Smile */}
      <Path
        d="M35 65 Q50 75 65 65"
        stroke="#E74C3C"
        strokeWidth="3"
        fill="none"
      />
      
      {/* Collar */}
      <Path
        d="M25 80 Q50 90 75 80"
        fill="#2ECC71"
      />
      <G>
        <Circle cx="35" cy="82" r="4" fill="#F1C40F" />
        <Circle cx="50" cy="85" r="4" fill="#F1C40F" />
        <Circle cx="65" cy="82" r="4" fill="#F1C40F" />
      </G>
      
      {/* Pattern Details */}
      <G>
        <Path
          d="M30 75 L35 80 M40 75 L45 80"
          stroke="#27AE60"
          strokeWidth="2"
        />
        <Path
          d="M55 75 L60 80 M65 75 L70 80"
          stroke="#27AE60"
          strokeWidth="2"
        />
      </G>
      
      {/* Stars */}
      <G>
        <Path
          d="M20 20 L22 25 L18 25 Z"
          fill="#F1C40F"
        />
        <Path
          d="M80 20 L82 25 L78 25 Z"
          fill="#F1C40F"
        />
      </G>
    </Svg>
  );
};
