import React from 'react';
import Svg, { Circle, Path, G, Rect } from 'react-native-svg';
import { ViewStyle } from 'react-native';

interface KnightAvatarProps {
  size?: number;
  style?: ViewStyle;
}

export const KnightAvatar: React.FC<KnightAvatarProps> = ({ size = 100, style }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
      {/* Background */}
      <Circle cx="50" cy="50" r="50" fill="#7F8C8D" />
      
      {/* Helmet Base */}
      <Path
        d="M30 60 Q50 70 70 60 L70 40 Q50 30 30 40 Z"
        fill="#BDC3C7"
      />
      
      {/* Helmet Top */}
      <Path
        d="M30 40 Q50 20 70 40"
        fill="#95A5A6"
      />
      
      {/* Visor */}
      <Path
        d="M35 45 Q50 50 65 45"
        fill="#2C3E50"
      />
      
      {/* Plume */}
      <G transform="translate(50, 25)">
        <Path
          d="M0 0 Q-10 -10 0 -20 Q10 -10 0 0"
          fill="#E74C3C"
        />
        <Path
          d="M-2 -15 Q0 -5 2 -15"
          stroke="#C0392B"
          strokeWidth="1"
          fill="none"
        />
      </G>
      
      {/* Armor Details */}
      <Path
        d="M30 60 Q50 80 70 60"
        fill="#95A5A6"
      />
      <G>
        <Path
          d="M40 65 L45 70 L40 75"
          stroke="#7F8C8D"
          strokeWidth="2"
          fill="none"
        />
        <Path
          d="M60 65 L55 70 L60 75"
          stroke="#7F8C8D"
          strokeWidth="2"
          fill="none"
        />
      </G>
      
      {/* Shield */}
      <G transform="translate(75, 70)">
        <Path
          d="M0 0 L-10 -5 L-10 5 Z"
          fill="#E67E22"
        />
        <Path
          d="M-9 -3 L-9 3"
          stroke="#D35400"
          strokeWidth="1"
        />
      </G>
      
      {/* Sword */}
      <G transform="translate(25, 70)">
        <Rect x="0" y="-5" width="10" height="2" fill="#BDC3C7" />
        <Path
          d="M10 -4 L15 -4 L12.5 -2 L10 -4"
          fill="#95A5A6"
        />
        <Circle cx="5" cy="-4" r="2" fill="#7F8C8D" />
      </G>
      
      {/* Metallic Shine */}
      <Path
        d="M40 35 L45 30 M55 30 L60 35"
        stroke="#ECF0F1"
        strokeWidth="1"
        opacity="0.5"
      />
    </Svg>
  );
};
