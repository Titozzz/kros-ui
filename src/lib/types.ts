export type SpellClassName =
  | "Feca"
  | "Osamodas"
  | "Enutrof"
  | "Sram"
  | "Xelor"
  | "Ecaflip"
  | "Eniripsa"
  | "Iop"
  | "Cra"
  | "Sadida"
  | "Sacrier"
  | "Pandawa"
  | "Rogue"
  | "Masqueraider"
  | "Ouginak"
  | "Foggernaut"
  | "Eliotrope"
  | "Huppermage"
  | "Forgelance"
  | "Commun";

export type SpellElement =
  | "Terre"
  | "Feu"
  | "Eau"
  | "Air"
  | "Neutre"
  | "Best";

export interface SpellModel {
  id: number;
  class: SpellClassName;
  name: string;
  element: SpellElement[];
  unlockLevel: number;
  description: string;
  iconId: number;
  isVariant: boolean;
}

// -- Raw JSON types --

export interface JsonSpellVariant {
  id: number;
  breedId: number;
  spells: JsonSpell[];
}

export interface JsonSpell {
  id: number;
  name: { fr: string };
  description: { fr: string };
  iconId: number;
  order: number;
  spellLevels: number[]; // IDs of levels
}

export interface JsonSpellLevel {
  id: number;
  spellId: number;
  grade: number;
  minPlayerLevel: number;
  apCost: number;
  range: number;
  minRange: number;
  effects: JsonSpellLevelEffect[];
}

export interface JsonSpellLevelEffect {
  effectId: number; // Links to effects_full.json
  effectElement: number; // -1=None, 0=Neutral, 1=Earth, 2=Fire, 3=Water, 4=Air (Hypothetical)
  diceNum?: number;
  diceSide?: number;
  value?: number;
}
