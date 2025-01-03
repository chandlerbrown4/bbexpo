import React from 'react';
import Svg, { Circle, Path, G } from 'react-native-svg';
import { ViewStyle } from 'react-native';

interface MermaidAvatarProps {
  size?: number;
  style?: ViewStyle;
}

export const MermaidAvatar: React.FC<MermaidAvatarProps> = ({ size = 100, style }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
      {/* Background */}
      <Circle cx="50" cy="50" r="50" fill="#1ABC9C" />
      
      {/* Underwater Effect */}
      <G>
        <Path
          d="M10 30 Q20 35 10 40 Q20 45 10 50"
          stroke="#16A085"
          strokeWidth="2"
          fill="none"
          opacity="0.5"
        />
        <Path
          d="M90 60 Q80 65 90 70 Q80 75 90 80"
          stroke="#16A085"
          strokeWidth="2"
          fill="none"
          opacity="0.5"
        />
      </G>
      
      {/* Tail */}
      <Path
        d="M35 60 Q50 100 65 60"
        fill="#E67E22"
      />
      
      {/* Scales Pattern */}
      <G>
        <Path
          d="M40 65 Q45 70 50 65"
          stroke="#D35400"
          strokeWidth="1"
          fill="none"
        />
        <Path
          d="M45 70 Q50 75 55 70"
          stroke="#D35400"
          strokeWidth="1"
          fill="none"
        />
        <Path
          d="M50 75 Q55 80 60 75"
          stroke="#D35400"
          strokeWidth="1"
          fill="none"
        />
      </G>
      
      {/* Upper Body */}
      <Path
        d="M35 60 Q50 50 65 60"
        fill="#FDEBD0"
      />
      
      {/* Face */}
      <Circle cx="50" cy="40" r="20" fill="#FDEBD0" />
      
      {/* Crown */}
      <Path
        d="M35 25 L45 30 L50 20 L55 30 L65 25"
        fill="#F1C40F"
      />
      <G>
        <Circle cx="45" cy="28" r="2" fill="#E67E22" />
        <Circle cx="50" cy="23" r="2" fill="#E74C3C" />
        <Circle cx="55" cy="28" r="2" fill="#E67E22" />
      </G>
      
      {/* Hair */}
      <G>
        <Path
          d="M30 40 Q25 30 30 20 Q40 10 50 15 Q60 10 70 20 Q75 30 70 40"
          fill="#8E44AD"
        />
        <Path
          d="M25 45 Q20 40 25 35"
          stroke="#8E44AD"
          strokeWidth="4"
          fill="none"
        />
        <Path
          d="M75 45 Q80 40 75 35"
          stroke="#8E44AD"
          strokeWidth="4"
          fill="none"
        />
      </G>
      
      {/* Eyes */}
      <G transform="translate(40, 40)">
        <Circle cx="0" cy="0" r="3" fill="#2C3E50" />
        <Circle cx="20" cy="0" r="3" fill="#2C3E50" />
        {/* Eyelashes */}
        <Path
          d="M-3 -2 L-5 -4 M0 -3 L0 -5 M3 -2 L5 -4"
          stroke="#2C3E50"
          strokeWidth="1"
        />
        <Path
          d="M17 -2 L15 -4 M20 -3 L20 -5 M23 -2 L25 -4"
          stroke="#2C3E50"
          strokeWidth="1"
        />
      </G>
      
      {/* Smile */}
      <Path
        d="M45 45 Q50 50 55 45"
        stroke="#2C3E50"
        strokeWidth="2"
        fill="none"
      />
      
      {/* Bubbles */}
      <G>
        <Circle cx="25" cy="15" r="3" fill="#FFFFFF" opacity="0.5" />
        <Circle cx="75" cy="25" r="2" fill="#FFFFFF" opacity="0.5" />
        <Circle cx="20" cy="70" r="2" fill="#FFFFFF" opacity="0.5" />
      </G>
    </Svg>
  );
};
