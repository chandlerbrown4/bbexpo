import React from 'react';
import Svg, { Circle, Path, G, Ellipse } from 'react-native-svg';
import { ViewStyle } from 'react-native';

interface AlienAvatarProps {
  size?: number;
  style?: ViewStyle;
}

export const AlienAvatar: React.FC<AlienAvatarProps> = ({ size = 100, style }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
      {/* Background */}
      <Circle cx="50" cy="50" r="50" fill="#27AE60" />
      
      {/* Head */}
      <Path
        d="M25 60 Q50 80 75 60 Q75 20 50 25 Q25 20 25 60"
        fill="#2ECC71"
      />
      
      {/* Eyes */}
      <G transform="translate(35, 45)">
        <Ellipse cx="0" cy="0" rx="8" ry="12" fill="#000000" />
        <Ellipse cx="30" cy="0" rx="8" ry="12" fill="#000000" />
        {/* Eye shine */}
        <Ellipse cx="2" cy="-2" rx="3" ry="4" fill="#FFFFFF" />
        <Ellipse cx="32" cy="-2" rx="3" ry="4" fill="#FFFFFF" />
      </G>
      
      {/* Mouth */}
      <Path
        d="M40 65 Q50 70 60 65"
        stroke="#1D8348"
        strokeWidth="2"
        fill="none"
      />
      
      {/* Antenna */}
      <G>
        <Path
          d="M40 25 Q35 15 40 5"
          stroke="#2ECC71"
          strokeWidth="3"
          fill="none"
        />
        <Path
          d="M60 25 Q65 15 60 5"
          stroke="#2ECC71"
          strokeWidth="3"
          fill="none"
        />
        <Circle cx="40" cy="5" r="3" fill="#F1C40F" />
        <Circle cx="60" cy="5" r="3" fill="#F1C40F" />
      </G>
      
      {/* Space suit collar */}
      <Path
        d="M25 70 Q50 80 75 70"
        stroke="#1D8348"
        strokeWidth="8"
        fill="none"
      />
    </Svg>
  );
};
