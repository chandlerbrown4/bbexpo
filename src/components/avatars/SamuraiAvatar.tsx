import React from 'react';
import Svg, { Circle, Path, G } from 'react-native-svg';
import { ViewStyle } from 'react-native';

interface SamuraiAvatarProps {
  size?: number;
  style?: ViewStyle;
}

export const SamuraiAvatar: React.FC<SamuraiAvatarProps> = ({ size = 100, style }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
      {/* Background */}
      <Circle cx="50" cy="50" r="50" fill="#C0392B" />
      
      {/* Helmet (Kabuto) */}
      <Path
        d="M25 45 Q50 25 75 45"
        fill="#2C3E50"
      />
      <Path
        d="M30 45 Q50 30 70 45"
        fill="#34495E"
      />
      
      {/* Helmet Crest */}
      <Path
        d="M45 25 Q50 15 55 25"
        stroke="#7F8C8D"
        strokeWidth="4"
        fill="none"
      />
      
      {/* Face Mask (Menpo) */}
      <Path
        d="M30 45 Q50 55 70 45 Q70 70 50 75 Q30 70 30 45"
        fill="#95A5A6"
      />
      
      {/* Mask Details */}
      <Path
        d="M35 55 L45 55 M55 55 L65 55"
        stroke="#7F8C8D"
        strokeWidth="2"
      />
      <Path
        d="M45 65 Q50 68 55 65"
        stroke="#7F8C8D"
        strokeWidth="2"
        fill="none"
      />
      
      {/* Eyes */}
      <G transform="translate(40, 50)">
        <Path
          d="M-2 0 L2 0"
          stroke="#2C3E50"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <Path
          d="M18 0 L22 0"
          stroke="#2C3E50"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </G>
      
      {/* Armor Plates */}
      <G>
        <Path
          d="M30 75 L40 80 L60 80 L70 75"
          fill="#34495E"
        />
        <Path
          d="M35 80 L40 85 L60 85 L65 80"
          fill="#2C3E50"
        />
      </G>
      
      {/* Katana */}
      <G transform="translate(75, 60) rotate(-45)">
        <Path
          d="M0 0 L20 0"
          stroke="#BDC3C7"
          strokeWidth="2"
        />
        <Path
          d="M0 0 L-5 0"
          stroke="#8B4513"
          strokeWidth="3"
        />
      </G>
      
      {/* Shoulder Guards */}
      <Path
        d="M25 60 L30 50 L35 60"
        fill="#34495E"
      />
      <Path
        d="M65 60 L70 50 L75 60"
        fill="#34495E"
      />
      
      {/* Battle Scars */}
      <Path
        d="M60 40 L65 42"
        stroke="#7F8C8D"
        strokeWidth="1"
      />
      
      {/* Japanese Pattern */}
      <G>
        <Circle cx="50" cy="35" r="2" fill="#E74C3C" />
        <Path
          d="M45 35 L55 35"
          stroke="#E74C3C"
          strokeWidth="1"
        />
      </G>
    </Svg>
  );
};
