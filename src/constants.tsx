import { Star, Code, Palette, Megaphone, PenTool, Briefcase, GraduationCap, Music, Camera, Globe, Languages, Cpu, Layers, Settings } from 'lucide-react';

export const SKILL_ICONS_MAP: Record<string, any> = {
  Star, Code, Palette, Megaphone, PenTool, Briefcase, GraduationCap, Music, Camera, Globe, Languages, Cpu, Layers, Settings
};

export const SKILL_ICONS_LIST = Object.keys(SKILL_ICONS_MAP);

export interface Skill {
  name: string;
  category: string;
  description?: string;
  url?: string;
  icon?: string;
}
