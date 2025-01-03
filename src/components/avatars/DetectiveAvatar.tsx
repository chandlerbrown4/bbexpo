import React from 'react';
import Svg, { Circle, Path, G, Ellipse } from 'react-native-svg';
import { ViewStyle } from 'react-native';

interface DetectiveAvatarProps {
  size?: number;
  style?: ViewStyle;
}

export const DetectiveAvatar: React.FC<DetectiveAvatarProps> = ({ size = 100, style }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
      {/* Background */}
      <Circle cx="50" cy="50" r="50" fill="#95A5A6" />
      
      {/* Hat */}
      <Path
        d="M25 40 L75 40 L70 35 L30 35 Z"
        fill="#34495E"
      />
      <Path
        d="M30 35 Q50 30 70 35"
        fill="#2C3E50"
      />
      
      {/* Face */}
      <Circle cx="50" cy="50" r="25" fill="#FDEBD0" />
      
      {/* Magnifying Glass */}
      <G transform="translate(70, 60) rotate(-20)">
        <Circle cx="0" cy="0" r="12" stroke="#2C3E50" strokeWidth="3" fill="none" />
        <Path
          d="M8 8 L20 20"
          stroke="#2C3E50"
          strokeWidth="4"
          strokeLinecap="round"
        />
        {/* Glass Shine */}
        <Path
          d="M-5 -5 L-2 -2"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.5"
        />
      </G>
      
      {/* Eyes */}
      <G transform="translate(35, 45)">
        <Circle cx="0" cy="0" r="3" fill="#2C3E50" />
        <Circle cx="30" cy="0" r="3" fill="#2C3E50" />
        {/* Eyebrows */}
        <Path
          d="M-5 -5 L5 -5"
          stroke="#2C3E50"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <Path
          d="M25 -5 L35 -5"
          stroke="#2C3E50"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </G>
      
      {/* Mustache */}
      <Path
        d="M40 55 Q50 60 60 55"
        stroke="#34495E"
        strokeWidth="2"
        fill="none"
      />
      
      {/* Coat Collar */}
      <Path
        d="M30 70 L40 60 L60 60 L70 70"
        fill="#34495E"
      />
      
      {/* Pipe */}
      <G transform="translate(40, 58)">
        <Path
          d="M0 0 Q5 -2 10 0"
          stroke="#8B4513"
          strokeWidth="2"
          fill="none"
        />
        <Path
          d="M10 0 Q12 -1 12 -3 Q12 -5 10 -5 L8 -5 Q7 -5 7 -3"
          fill="#8B4513"
        />
        {/* Smoke */}
        <Path
          d="M12 -5 Q14 -8 12 -10 M14 -7 Q16 -10 14 -12"
          stroke="#BDC3C7"
          strokeWidth="1"
          fill="none"
          opacity="0.5"
        />
      </G>
    </Svg>
  );
};
