import React from 'react';
import Svg, { Circle, Path, G, Rect } from 'react-native-svg';
import { ViewStyle } from 'react-native';

interface DJAvatarProps {
  size?: number;
  style?: ViewStyle;
}

export const DJAvatar: React.FC<DJAvatarProps> = ({ size = 100, style }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
      {/* Background */}
      <Circle cx="50" cy="50" r="50" fill="#9B59B6" />
      
      {/* Headphones */}
      <Path
        d="M20 45 Q50 20 80 45"
        stroke="#2C3E50"
        strokeWidth="4"
        fill="none"
      />
      <G transform="translate(20, 45)">
        <Rect x="-5" y="-10" width="10" height="20" rx="5" fill="#2C3E50" />
        <Circle cx="0" cy="0" r="6" fill="#E74C3C" />
      </G>
      <G transform="translate(80, 45)">
        <Rect x="-5" y="-10" width="10" height="20" rx="5" fill="#2C3E50" />
        <Circle cx="0" cy="0" r="6" fill="#E74C3C" />
      </G>
      
      {/* Face */}
      <Circle cx="50" cy="50" r="25" fill="#ECF0F1" />
      
      {/* Sunglasses */}
      <G transform="translate(35, 45)">
        <Path
          d="M0 0 L30 0"
          stroke="#2C3E50"
          strokeWidth="2"
        />
        <Path
          d="M-5 0 A5 5 0 0 1 5 0 A5 5 0 0 1 -5 0"
          fill="#2C3E50"
        />
        <Path
          d="M25 0 A5 5 0 0 1 35 0 A5 5 0 0 1 25 0"
          fill="#2C3E50"
        />
      </G>
      
      {/* Mouth */}
      <Path
        d="M40 60 Q50 65 60 60"
        stroke="#2C3E50"
        strokeWidth="2"
        fill="none"
      />
      
      {/* Music Notes */}
      <G transform="translate(15, 25)">
        <Circle cx="0" cy="0" r="3" fill="#F1C40F" />
        <Path
          d="M3 0 L3 -10"
          stroke="#F1C40F"
          strokeWidth="2"
        />
      </G>
      <G transform="translate(85, 25)">
        <Circle cx="0" cy="0" r="3" fill="#F1C40F" />
        <Path
          d="M3 0 L3 -10"
          stroke="#F1C40F"
          strokeWidth="2"
        />
      </G>
      
      {/* Equalizer Bars */}
      <G transform="translate(25, 80)">
        <Rect x="0" y="0" width="4" height="10" fill="#F1C40F" />
        <Rect x="6" y="-5" width="4" height="15" fill="#F1C40F" />
        <Rect x="12" y="5" width="4" height="5" fill="#F1C40F" />
      </G>
      <G transform="translate(65, 80)">
        <Rect x="0" y="5" width="4" height="5" fill="#F1C40F" />
        <Rect x="6" y="-5" width="4" height="15" fill="#F1C40F" />
        <Rect x="12" y="0" width="4" height="10" fill="#F1C40F" />
      </G>
    </Svg>
  );
};
