import React from 'react';
import Svg, { Circle, Path, G } from 'react-native-svg';
import { ViewStyle } from 'react-native';

interface DragonAvatarProps {
  size?: number;
  style?: ViewStyle;
}

export const DragonAvatar: React.FC<DragonAvatarProps> = ({ size = 100, style }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
      {/* Background */}
      <Circle cx="50" cy="50" r="50" fill="#C0392B" />
      
      {/* Head */}
      <Path
        d="M30 40 Q50 60 70 40 Q70 20 50 25 Q30 20 30 40"
        fill="#E74C3C"
      />
      
      {/* Horns */}
      <Path
        d="M35 25 L25 15 M65 25 L75 15"
        stroke="#2C3E50"
        strokeWidth="4"
        strokeLinecap="round"
      />
      
      {/* Eyes */}
      <G transform="translate(40, 35)">
        <Circle cx="0" cy="0" r="5" fill="#F1C40F" />
        <Circle cx="20" cy="0" r="5" fill="#F1C40F" />
        {/* Slitted pupils */}
        <Path
          d="M-2 -2 L2 2 M18 -2 L22 2"
          stroke="#000000"
          strokeWidth="1"
        />
      </G>
      
      {/* Nostrils */}
      <G transform="translate(45, 45)">
        <Circle cx="0" cy="0" r="2" fill="#2C3E50" />
        <Circle cx="10" cy="0" r="2" fill="#2C3E50" />
      </G>
      
      {/* Scales */}
      <G>
        <Path
          d="M35 50 Q50 55 65 50"
          stroke="#C0392B"
          strokeWidth="2"
          fill="none"
        />
        <Path
          d="M30 60 Q50 65 70 60"
          stroke="#C0392B"
          strokeWidth="2"
          fill="none"
        />
        <Path
          d="M25 70 Q50 75 75 70"
          stroke="#C0392B"
          strokeWidth="2"
          fill="none"
        />
      </G>
      
      {/* Wings */}
      <G>
        <Path
          d="M15 40 Q5 30 15 20"
          stroke="#E74C3C"
          strokeWidth="4"
          fill="none"
        />
        <Path
          d="M85 40 Q95 30 85 20"
          stroke="#E74C3C"
          strokeWidth="4"
          fill="none"
        />
      </G>
      
      {/* Fire */}
      <G transform="translate(50, 80)">
        <Path
          d="M-10 0 Q0 -10 10 0"
          fill="#F39C12"
        />
        <Path
          d="M-5 0 Q0 -5 5 0"
          fill="#F1C40F"
        />
      </G>
    </Svg>
  );
};
