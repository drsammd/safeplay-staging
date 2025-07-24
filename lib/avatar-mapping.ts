
/**
 * CENTRALIZED AVATAR MAPPING SYSTEM - PHASE 1 (15 UNIQUE AVATARS)
 * 
 * This file provides a single source of truth for child name-to-avatar mappings
 * across all SafePlay components. Each unique child name gets exactly one unique avatar.
 * 
 * ✅ PHASE 1 IMPROVEMENTS:
 * - 15 unique, diverse avatars (was 6)
 * - ~2 children per avatar (was ~5 per avatar)
 * - 60% reduction in avatar duplication
 * - Professional, realistic appearance for demos
 * - Local avatar files for better performance
 * 
 * ✅ ENSURES:
 * - Each unique name has exactly one unique avatar
 * - Minimal avatar duplication across different names  
 * - No multiple avatars for the same name
 * - Consistent mapping across all components
 * - Enhanced professional appearance for demos
 */

// Available avatar paths (15 unique, diverse avatars)
const AVATAR_URLS = [
  '/images/avatars/child-avatar-01.png',
  '/images/avatars/child-avatar-02.png',
  '/images/avatars/child-avatar-03.png',
  '/images/avatars/child-avatar-04.png',
  '/images/avatars/child-avatar-05.png',
  '/images/avatars/child-avatar-06.png',
  '/images/avatars/child-avatar-07.png',
  '/images/avatars/child-avatar-08.png',
  '/images/avatars/child-avatar-09.png',
  '/images/avatars/child-avatar-10.png',
  '/images/avatars/child-avatar-11.png',
  '/images/avatars/child-avatar-12.png',
  '/images/avatars/child-avatar-13.png',
  '/images/avatars/child-avatar-14.png',
  '/images/avatars/child-avatar-15.png',
];

/**
 * MASTER AVATAR MAPPING - PHASE 1 (15 UNIQUE AVATARS)
 * Each unique child name is assigned exactly one unique avatar URL
 * Distributed across 15 unique avatars for maximum diversity
 * ~2 children per avatar (significant improvement from previous 5:1 ratio)
 */
export const CHILD_AVATAR_MAPPING: Record<string, string> = {
  // Primary children from tracking page and camera feed (first 15 with unique avatars)
  'Emma Johnson': AVATAR_URLS[0],      // child-avatar-01.png
  'Michael Chen': AVATAR_URLS[1],      // child-avatar-02.png
  'Sofia Martinez': AVATAR_URLS[2],    // child-avatar-03.png
  'Lucas Anderson': AVATAR_URLS[3],    // child-avatar-04.png
  'Marcus Thompson': AVATAR_URLS[4],   // child-avatar-05.png
  'Aria Kim': AVATAR_URLS[5],          // child-avatar-06.png
  'Diego Rodriguez': AVATAR_URLS[6],   // child-avatar-07.png
  'Zoe Williams': AVATAR_URLS[7],      // child-avatar-08.png
  'Noah Davis': AVATAR_URLS[8],        // child-avatar-09.png
  'Maya Patel': AVATAR_URLS[9],        // child-avatar-10.png
  'Elijah Brown': AVATAR_URLS[10],     // child-avatar-11.png
  'Olivia Parker': AVATAR_URLS[11],    // child-avatar-12.png
  'Ethan Wilson': AVATAR_URLS[12],     // child-avatar-13.png
  'Isabella Garcia': AVATAR_URLS[13],  // child-avatar-14.png
  'Aiden Smith': AVATAR_URLS[14],      // child-avatar-15.png
  
  // Second set - strategic distribution for demo realism (max 2 per avatar)
  'Chloe Taylor': AVATAR_URLS[0],      // Second child for avatar-01
  'Jackson Lee': AVATAR_URLS[1],       // Second child for avatar-02
  'Grace Wilson': AVATAR_URLS[2],      // Second child for avatar-03
  'Oliver Martinez': AVATAR_URLS[3],   // Second child for avatar-04
  'Lily Thompson': AVATAR_URLS[4],     // Second child for avatar-05
  'Mason Davis': AVATAR_URLS[5],       // Second child for avatar-06
  'Ava Rodriguez': AVATAR_URLS[6],     // Second child for avatar-07
  'Logan Kim': AVATAR_URLS[7],         // Second child for avatar-08
  'Mia Johnson': AVATAR_URLS[8],       // Second child for avatar-09
  'Carter Chen': AVATAR_URLS[9],       // Second child for avatar-10
  'Harper Anderson': AVATAR_URLS[10],  // Second child for avatar-11
  'Wyatt Parker': AVATAR_URLS[11],     // Second child for avatar-12
  'Ella Brown': AVATAR_URLS[12],       // Second child for avatar-13
  'Liam Garcia': AVATAR_URLS[13],      // Second child for avatar-14
  'Scarlett Smith': AVATAR_URLS[14],   // Second child for avatar-15
};

/**
 * Get avatar for a child by name
 * Returns the consistent avatar URL for the given child name
 * Falls back to first avatar if name not found (for future-proofing)
 */
export function getChildAvatar(childName: string): string {
  return CHILD_AVATAR_MAPPING[childName] || AVATAR_URLS[0];
}

/**
 * Get all available child names with their avatars
 * Useful for components that need the complete list
 */
export function getAllChildrenWithAvatars(): Array<{ name: string; avatar: string }> {
  return Object.entries(CHILD_AVATAR_MAPPING).map(([name, avatar]) => ({
    name,
    avatar
  }));
}

/**
 * Get children by avatar URL (for filtering/grouping purposes)
 * Returns all child names that use the specified avatar
 */
export function getChildrenByAvatar(avatarUrl: string): string[] {
  return Object.entries(CHILD_AVATAR_MAPPING)
    .filter(([_, avatar]) => avatar === avatarUrl)
    .map(([name, _]) => name);
}

/**
 * Validate avatar mapping consistency
 * Returns true if all names have valid avatar assignments
 */
export function validateAvatarMapping(): boolean {
  const names = Object.keys(CHILD_AVATAR_MAPPING);
  const validUrls = new Set(AVATAR_URLS);
  
  return names.every(name => {
    const avatar = CHILD_AVATAR_MAPPING[name];
    return avatar && validUrls.has(avatar);
  });
}

/**
 * Get random subset of children (maintaining consistent avatars)
 * Useful for simulations that need a random selection of children
 */
export function getRandomChildren(count: number): Array<{ name: string; avatar: string }> {
  const allChildren = getAllChildrenWithAvatars();
  const shuffled = [...allChildren].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, allChildren.length));
}

/**
 * DEMO CHILDREN ARRAYS (for backward compatibility)
 * Components can import these instead of defining their own arrays
 */

// All children names (consistent across components)
export const DEMO_CHILDREN_NAMES = Object.keys(CHILD_AVATAR_MAPPING);

// All avatar URLs (consistent across components)
export const DEMO_AVATAR_URLS = AVATAR_URLS;

// Children with their zone preferences (for zone simulations) - PHASE 1: 30 CHILDREN WITH 15 UNIQUE AVATARS
export const CHILDREN_WITH_ZONES = [
  // First set - 15 children with unique avatars
  {
    name: 'Emma Johnson',
    avatar: getChildAvatar('Emma Johnson'),
    zones: ['Play Area A', 'Climbing Zone', 'Snack Bar']
  },
  {
    name: 'Michael Chen',
    avatar: getChildAvatar('Michael Chen'),
    zones: ['Play Area B', 'Ball Pit', 'Toddler Area']
  },
  {
    name: 'Sofia Martinez',
    avatar: getChildAvatar('Sofia Martinez'),
    zones: ['Exit Zone', 'Main Entrance', 'Restrooms']
  },
  {
    name: 'Lucas Anderson',
    avatar: getChildAvatar('Lucas Anderson'),
    zones: ['Ball Pit', 'Play Area A', 'Toddler Area']
  },
  {
    name: 'Marcus Thompson',
    avatar: getChildAvatar('Marcus Thompson'),
    zones: ['Climbing Zone', 'Play Area A', 'Ball Pit']
  },
  {
    name: 'Aria Kim',
    avatar: getChildAvatar('Aria Kim'),
    zones: ['Toddler Area', 'Snack Bar', 'Play Area B']
  },
  {
    name: 'Diego Rodriguez',
    avatar: getChildAvatar('Diego Rodriguez'),
    zones: ['Ball Pit', 'Play Area A', 'Climbing Zone']
  },
  {
    name: 'Zoe Williams',
    avatar: getChildAvatar('Zoe Williams'),
    zones: ['Play Area B', 'Snack Bar', 'Main Entrance']
  },
  {
    name: 'Noah Davis',
    avatar: getChildAvatar('Noah Davis'),
    zones: ['Climbing Zone', 'Exit Zone', 'Play Area A']
  },
  {
    name: 'Maya Patel',
    avatar: getChildAvatar('Maya Patel'),
    zones: ['Toddler Area', 'Play Area B', 'Ball Pit']
  },
  {
    name: 'Elijah Brown',
    avatar: getChildAvatar('Elijah Brown'),
    zones: ['Play Area A', 'Climbing Zone', 'Snack Bar']
  },
  {
    name: 'Olivia Parker',
    avatar: getChildAvatar('Olivia Parker'),
    zones: ['Ball Pit', 'Play Area B', 'Toddler Area']
  },
  {
    name: 'Ethan Wilson',
    avatar: getChildAvatar('Ethan Wilson'),
    zones: ['Main Entrance', 'Play Area A', 'Restrooms']
  },
  {
    name: 'Isabella Garcia',
    avatar: getChildAvatar('Isabella Garcia'),
    zones: ['Play Area B', 'Snack Bar', 'Exit Zone']
  },
  {
    name: 'Aiden Smith',
    avatar: getChildAvatar('Aiden Smith'),
    zones: ['Climbing Zone', 'Toddler Area', 'Play Area A']
  },
  
  // Second set - 15 additional children for realistic demo scale
  {
    name: 'Chloe Taylor',
    avatar: getChildAvatar('Chloe Taylor'),
    zones: ['Play Area B', 'Ball Pit', 'Snack Bar']
  },
  {
    name: 'Jackson Lee',
    avatar: getChildAvatar('Jackson Lee'),
    zones: ['Climbing Zone', 'Main Entrance', 'Play Area A']
  },
  {
    name: 'Grace Wilson',
    avatar: getChildAvatar('Grace Wilson'),
    zones: ['Toddler Area', 'Exit Zone', 'Play Area B']
  },
  {
    name: 'Oliver Martinez',
    avatar: getChildAvatar('Oliver Martinez'),
    zones: ['Ball Pit', 'Restrooms', 'Play Area A']
  },
  {
    name: 'Lily Thompson',
    avatar: getChildAvatar('Lily Thompson'),
    zones: ['Play Area B', 'Climbing Zone', 'Snack Bar']
  },
  {
    name: 'Mason Davis',
    avatar: getChildAvatar('Mason Davis'),
    zones: ['Toddler Area', 'Main Entrance', 'Ball Pit']
  },
  {
    name: 'Ava Rodriguez',
    avatar: getChildAvatar('Ava Rodriguez'),
    zones: ['Play Area A', 'Exit Zone', 'Climbing Zone']
  },
  {
    name: 'Logan Kim',
    avatar: getChildAvatar('Logan Kim'),
    zones: ['Ball Pit', 'Play Area B', 'Restrooms']
  },
  {
    name: 'Mia Johnson',
    avatar: getChildAvatar('Mia Johnson'),
    zones: ['Snack Bar', 'Toddler Area', 'Main Entrance']
  },
  {
    name: 'Carter Chen',
    avatar: getChildAvatar('Carter Chen'),
    zones: ['Climbing Zone', 'Play Area A', 'Exit Zone']
  },
  {
    name: 'Harper Anderson',
    avatar: getChildAvatar('Harper Anderson'),
    zones: ['Play Area B', 'Ball Pit', 'Toddler Area']
  },
  {
    name: 'Wyatt Parker',
    avatar: getChildAvatar('Wyatt Parker'),
    zones: ['Main Entrance', 'Restrooms', 'Play Area A']
  },
  {
    name: 'Ella Brown',
    avatar: getChildAvatar('Ella Brown'),
    zones: ['Climbing Zone', 'Snack Bar', 'Play Area B']
  },
  {
    name: 'Liam Garcia',
    avatar: getChildAvatar('Liam Garcia'),
    zones: ['Toddler Area', 'Ball Pit', 'Exit Zone']
  },
  {
    name: 'Scarlett Smith',
    avatar: getChildAvatar('Scarlett Smith'),
    zones: ['Play Area A', 'Climbing Zone', 'Main Entrance']
  }
];

export default {
  getChildAvatar,
  getAllChildrenWithAvatars,
  getChildrenByAvatar,
  validateAvatarMapping,
  getRandomChildren,
  CHILD_AVATAR_MAPPING,
  DEMO_CHILDREN_NAMES,
  DEMO_AVATAR_URLS,
  CHILDREN_WITH_ZONES
};
