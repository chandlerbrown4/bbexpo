import React from 'react';
import Svg, { Circle, Path, G } from 'react-native-svg';
import { ViewStyle } from 'react-native';

interface PirateAvatarProps {
  size?: number;
  style?: ViewStyle;
}

export const PirateAvatar: React.FC<PirateAvatarProps> = ({ size = 100, style }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
      {/* Background */}
      <Circle cx="50" cy="50" r="50" fill="#2C3E50" />
      
      {/* Head */}
      <Circle cx="50" cy="50" r="30" fill="#D35400" />
      
      {/* Bandana */}
      <Path
        d="M20 40 Q50 35 80 40"
        fill="#E74C3C"
      />
      <Path
        d="M80 40 L85 35 L90 45"
        fill="#E74C3C"
      />
      
      {/* Eye Patch */}
      <G transform="translate(35, 45)">
        <Circle cx="0" cy="0" r="8" fill="#2C3E50" />
        <Path
          d="M-8 -5 L8 -5"
          stroke="#2C3E50"
          strokeWidth="3"
        />
      </G>
      
      {/* Good Eye */}
      <G transform="translate(60, 45)">
        <Circle cx="0" cy="0" r="5" fill="#2C3E50" />
        <Circle cx="0" cy="0" r="2" fill="#FFFFFF" />
      </G>
      
      {/* Beard */}
      <Path
        d="M35 55 Q50 70 65 55"
        fill="#34495E"
      />
      <G>
        <Path
          d="M40 60 L45 65"
          stroke="#34495E"
          strokeWidth="2"
        />
        <Path
          d="M50 62 L52 68"
          stroke="#34495E"
          strokeWidth="2"
        />
        <Path
          d="M60 60 L55 65"
          stroke="#34495E"
          strokeWidth="2"
        />
      </G>
      
      {/* Earring */}
      <Circle cx="75" cy="50" r="2" fill="#F1C40F" />
      
      {/* Skull and Crossbones */}
      <G transform="translate(50, 20) scale(0.5)">
        <Circle cx="0" cy="0" r="8" fill="#FFFFFF" />
        <Path
          d="M-5 10 L5 -10 M-5 -10 L5 10"
          stroke="#FFFFFF"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </G>
      
      {/* Scar */}
      <Path
        d="M65 35 L70 40"
        stroke="#C0392B"
        strokeWidth="1"
      />
    </Svg>
  );
};
