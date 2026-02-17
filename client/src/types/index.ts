export interface Position {
  x: number;
  y: number;
}

export interface Player {
  playerId: string;
  username: string;
  character?: Character;
  selectedCards: string[];
  health: number;
  energy: number;
  position: Position;
  isReady: boolean;
  isConnected: boolean;
}

export interface Room {
  _id: string;
  roomId: string;
  status: 'waiting' | 'character_select' | 'card_select' | 'battle' | 'finished';
  players: Player[];
  currentRound: number;
  currentCardIndex: number;
  winner?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Character {
  _id: string;
  characterId: string;
  name: string;
  description: string;
  baseHealth: number;
  baseEnergy: number;
  attackCards: string[];
  imageUrl?: string;
  isActive: boolean;
}

export interface Card {
  _id: string;
  cardId: string;
  name: string;
  type: 'movement' | 'attack' | 'utility';
  description: string;
  energyCost: number;
  damage?: number;
  healing?: number;
  defense?: number;
  movement?: {
    x: number;
    y: number;
  };
  pattern?: number[][];
  isCommon: boolean;
  imageUrl?: string;
  isActive: boolean;
}
