export type AvatarType = {
  id: string;
  component: string;
};

export const AVATARS: AvatarType[] = [
  { id: 'walrus', component: 'WalrusAvatar' },
  { id: 'penguin', component: 'PenguinAvatar' },
  { id: 'bear', component: 'BearAvatar' },
  { id: 'fox', component: 'FoxAvatar' },
  { id: 'robot', component: 'RobotAvatar' },
  { id: 'alien', component: 'AlienAvatar' },
  { id: 'ninja', component: 'NinjaAvatar' },
  { id: 'wizard', component: 'WizardAvatar' },
  { id: 'astronaut', component: 'AstronautAvatar' },
  { id: 'dragon', component: 'DragonAvatar' },
  { id: 'dj', component: 'DJAvatar' },
  { id: 'chef', component: 'ChefAvatar' },
  { id: 'superhero', component: 'SuperheroAvatar' },
  { id: 'vampire', component: 'VampireAvatar' },
  { id: 'knight', component: 'KnightAvatar' },
  { id: 'pirate', component: 'PirateAvatar' },
  { id: 'scientist', component: 'ScientistAvatar' },
  { id: 'detective', component: 'DetectiveAvatar' },
  { id: 'cowboy', component: 'CowboyAvatar' },
  { id: 'mermaid', component: 'MermaidAvatar' },
  { id: 'jester', component: 'JesterAvatar' },
  { id: 'samurai', component: 'SamuraiAvatar' },
];

// This will be stored in the avatar_url field
export const getAvatarUrl = (avatarId: string) => `avatar://${avatarId}`;
