import { drawPortraitLook } from '../game/chibi';
import { HERO_MAP } from './gamedata';

const cache = new Map<string, string>();

export function heroPortrait(heroId: string): string {
  const hit = cache.get(heroId);
  if (hit) return hit;
  const def = HERO_MAP[heroId];
  if (!def) return '';
  const url = drawPortraitLook(def.look);
  cache.set(heroId, url);
  return url;
}
