import React from 'react';
import Svg, { Circle, Rect, Path, G } from 'react-native-svg';
import { ViewStyle } from 'react-native';

interface RobotAvatarProps {
  size?: number;
  style?: ViewStyle;
}

export const RobotAvatar: React.FC<RobotAvatarProps> = ({ size = 100, style }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
      {/* Background */}
      <Circle cx="50" cy="50" r="50" fill="#2C3E50" />
      
      {/* Head */}
      <Rect x="30" y="25" width="40" height="35" rx="5" fill="#95A5A6" />
      
      {/* Antenna */}
      <Path
        d="M50 15 L50 25 M45 15 L55 15"
        stroke="#E74C3C"
        strokeWidth="3"
        strokeLinecap="round"
      />
      
      {/* Eyes */}
      <G transform="translate(38, 35)">
        <Circle cx="0" cy="0" r="5" fill="#3498DB" />
        <Circle cx="24" cy="0" r="5" fill="#3498DB" />
        {/* Eye glow */}
        <Circle cx="0" cy="0" r="2" fill="#E8F6FF" />
        <Circle cx="24" cy="0" r="2" fill="#E8F6FF" />
      </G>
      
      {/* Mouth grid */}
      <G transform="translate(40, 45)">
        <Rect x="0" y="0" width="20" height="8" fill="#7F8C8D" />
        <Path
          d="M0 4 H20 M5 0 V8 M10 0 V8 M15 0 V8"
          stroke="#6C7A7A"
          strokeWidth="1"
        />
      </G>
      
      {/* Neck */}
      <Rect x="42" y="60" width="16" height="5" fill="#7F8C8D" />
      
      {/* Body */}
      <G transform="translate(30, 65)">
        <Rect x="0" y="0" width="40" height="30" rx="5" fill="#95A5A6" />
        {/* Body details */}
        <Circle cx="20" cy="15" r="8" fill="#3498DB" />
        <Circle cx="20" cy="15" r="5" fill="#2980B9" />
        <Rect x="5" y="5" width="6" height="6" rx="1" fill="#7F8C8D" />
        <Rect x="29" y="5" width="6" height="6" rx="1" fill="#7F8C8D" />
      </G>
    </Svg>
  );
};
