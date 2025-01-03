import React from 'react';
import Svg, { Circle, Path, G } from 'react-native-svg';
import { ViewStyle } from 'react-native';

interface WizardAvatarProps {
  size?: number;
  style?: ViewStyle;
}

export const WizardAvatar: React.FC<WizardAvatarProps> = ({ size = 100, style }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
      {/* Background */}
      <Circle cx="50" cy="50" r="50" fill="#8E44AD" />
      
      {/* Wizard Hat */}
      <Path
        d="M30 45 L50 10 L70 45"
        fill="#2C3E50"
      />
      <Path
        d="M25 45 L75 45"
        stroke="#E74C3C"
        strokeWidth="4"
      />
      <Circle cx="50" cy="30" r="3" fill="#F1C40F" />
      
      {/* Face */}
      <Circle cx="50" cy="60" r="25" fill="#ECF0F1" />
      
      {/* Beard */}
      <Path
        d="M30 55 Q50 90 70 55"
        fill="#95A5A6"
      />
      
      {/* Eyes */}
      <G transform="translate(40, 55)">
        <Circle cx="0" cy="0" r="3" fill="#2C3E50" />
        <Circle cx="20" cy="0" r="3" fill="#2C3E50" />
        {/* Eyebrows */}
        <Path
          d="M-5 -5 L5 -5"
          stroke="#7F8C8D"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <Path
          d="M15 -5 L25 -5"
          stroke="#7F8C8D"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </G>
      
      {/* Magic sparkles */}
      <G>
        <Circle cx="20" cy="30" r="2" fill="#F1C40F" />
        <Circle cx="80" cy="30" r="2" fill="#F1C40F" />
        <Circle cx="30" cy="70" r="2" fill="#F1C40F" />
        <Circle cx="70" cy="70" r="2" fill="#F1C40F" />
      </G>
    </Svg>
  );
};
