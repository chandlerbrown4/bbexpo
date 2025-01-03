import React from 'react';
import Svg, { Circle, Path, G } from 'react-native-svg';
import { ViewStyle } from 'react-native';

interface VampireAvatarProps {
  size?: number;
  style?: ViewStyle;
}

export const VampireAvatar: React.FC<VampireAvatarProps> = ({ size = 100, style }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
      {/* Background */}
      <Circle cx="50" cy="50" r="50" fill="#8E44AD" />
      
      {/* Cape */}
      <Path
        d="M20 45 L50 100 L80 45"
        fill="#2C3E50"
      />
      <Path
        d="M15 45 L25 45"
        stroke="#2C3E50"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <Path
        d="M75 45 L85 45"
        stroke="#2C3E50"
        strokeWidth="10"
        strokeLinecap="round"
      />
      
      {/* Head */}
      <Circle cx="50" cy="40" r="25" fill="#ECF0F1" />
      
      {/* Hair */}
      <Path
        d="M25 30 Q50 20 75 30"
        fill="#2C3E50"
      />
      <Path
        d="M25 30 L35 40 M65 40 L75 30"
        stroke="#2C3E50"
        strokeWidth="4"
      />
      
      {/* Eyes */}
      <G transform="translate(35, 35)">
        <Circle cx="0" cy="0" r="5" fill="#E74C3C" />
        <Circle cx="30" cy="0" r="5" fill="#E74C3C" />
        {/* Glowing effect */}
        <Circle cx="0" cy="0" r="3" fill="#C0392B" />
        <Circle cx="30" cy="0" r="3" fill="#C0392B" />
      </G>
      
      {/* Mouth and Fangs */}
      <Path
        d="M40 50 Q50 55 60 50"
        stroke="#2C3E50"
        strokeWidth="2"
        fill="none"
      />
      <Path
        d="M45 50 L45 55 M55 50 L55 55"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
      />
      
      {/* Bow Tie */}
      <G transform="translate(50, 60)">
        <Path
          d="M-5 0 L0 -3 L5 0 L0 3 Z"
          fill="#E74C3C"
        />
      </G>
      
      {/* Bats */}
      <G>
        <Path
          d="M20 20 Q25 15 30 20 Q25 25 20 20"
          fill="#2C3E50"
        />
        <Path
          d="M70 20 Q75 15 80 20 Q75 25 70 20"
          fill="#2C3E50"
        />
      </G>
    </Svg>
  );
};
