import React from 'react';
import { ViewStyle } from 'react-native';
import { WalrusAvatar } from './WalrusAvatar';
import { PenguinAvatar } from './PenguinAvatar';
import { BearAvatar } from './BearAvatar';
import { FoxAvatar } from './FoxAvatar';
import { RobotAvatar } from './RobotAvatar';
import { AlienAvatar } from './AlienAvatar';
import { NinjaAvatar } from './NinjaAvatar';
import { WizardAvatar } from './WizardAvatar';
import { AstronautAvatar } from './AstronautAvatar';
import { DragonAvatar } from './DragonAvatar';
import { DJAvatar } from './DJAvatar';
import { ChefAvatar } from './ChefAvatar';
import { SuperheroAvatar } from './SuperheroAvatar';
import { VampireAvatar } from './VampireAvatar';
import { KnightAvatar } from './KnightAvatar';
import { PirateAvatar } from './PirateAvatar';
import { ScientistAvatar } from './ScientistAvatar';
import { DetectiveAvatar } from './DetectiveAvatar';
import { CowboyAvatar } from './CowboyAvatar';
import { MermaidAvatar } from './MermaidAvatar';
import { JesterAvatar } from './JesterAvatar';
import { SamuraiAvatar } from './SamuraiAvatar';

interface AvatarImageProps {
  avatarUrl: string;
  size?: number;
  style?: ViewStyle;
}

export const AvatarImage: React.FC<AvatarImageProps> = ({ avatarUrl, size = 100, style }) => {
  const avatarId = avatarUrl?.startsWith('avatar://') 
    ? avatarUrl.replace('avatar://', '') 
    : null;

  if (!avatarId) {
    return <WalrusAvatar size={size} style={style} />;
  }

  switch (avatarId) {
    case 'walrus':
      return <WalrusAvatar size={size} style={style} />;
    case 'penguin':
      return <PenguinAvatar size={size} style={style} />;
    case 'bear':
      return <BearAvatar size={size} style={style} />;
    case 'fox':
      return <FoxAvatar size={size} style={style} />;
    case 'robot':
      return <RobotAvatar size={size} style={style} />;
    case 'alien':
      return <AlienAvatar size={size} style={style} />;
    case 'ninja':
      return <NinjaAvatar size={size} style={style} />;
    case 'wizard':
      return <WizardAvatar size={size} style={style} />;
    case 'astronaut':
      return <AstronautAvatar size={size} style={style} />;
    case 'dragon':
      return <DragonAvatar size={size} style={style} />;
    case 'dj':
      return <DJAvatar size={size} style={style} />;
    case 'chef':
      return <ChefAvatar size={size} style={style} />;
    case 'superhero':
      return <SuperheroAvatar size={size} style={style} />;
    case 'vampire':
      return <VampireAvatar size={size} style={style} />;
    case 'knight':
      return <KnightAvatar size={size} style={style} />;
    case 'pirate':
      return <PirateAvatar size={size} style={style} />;
    case 'scientist':
      return <ScientistAvatar size={size} style={style} />;
    case 'detective':
      return <DetectiveAvatar size={size} style={style} />;
    case 'cowboy':
      return <CowboyAvatar size={size} style={style} />;
    case 'mermaid':
      return <MermaidAvatar size={size} style={style} />;
    case 'jester':
      return <JesterAvatar size={size} style={style} />;
    case 'samurai':
      return <SamuraiAvatar size={size} style={style} />;
    default:
      return <WalrusAvatar size={size} style={style} />;
  }
};
