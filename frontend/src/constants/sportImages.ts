const BASE = '?auto=format&fit=crop&w=1200&q=80&sat=-100';
const u = (id: string) => `https://images.unsplash.com/photo-${id}${BASE}`;

export const SPORT_IMAGES: Record<string, string> = {
  'Arts martiaux':       u('1555597673-b21d5c935865'),
  'Basketball':          u('1546519638-68e109498ffc'),
  'Boxe':                u('1547153760-18fc86324498'),
  'Course à pied':       u('1461897104016-0b3b00cc81ee'),
  'Cross-training':      u('1534258936925-c58bed479fcb'),
  'Crossfit':            u('1534258936925-c58bed479fcb'),
  'Cyclisme':            u('1541625602330-2277a4c46182'),
  'Danse':               u('1508700929628-666bc8bd84ea'),
  'Escalade':            u('1527090526205-beaac8dc3c62'),
  'Fitness':             u('1517836357463-d25dfeac3438'),
  'Football':            u('1553778263-73a83bab9b0c'),
  'Golf':                u('1535131749006-b7f58c99034b'),
  'HIIT':                u('1581009146145-b5ef050c2e1e'),
  'Méditation':          u('1508672019048-805c876b67e2'),
  'MMA':                 u('1555597673-b21d5c935865'),
  'Musculation':         u('1534438327276-14e5300c3a48'),
  'Natation':            u('1530549387789-4c1017266635'),
  'Pilates':             u('1518611012118-696072aa579a'),
  'Préparation physique':u('1571902943202-507ec2618e8f'),
  'Rééducation':         u('1576091160550-2173dba999ef'),
  'Rugby':               u('1575361204480-aadea25e6e68'),
  'Self-défense':        u('1555597673-b21d5c935865'),
  'Ski':                 u('1551698618-1dfe5d97d256'),
  'Stretching':          u('1544367567-0f2fcb009e0b'),
  'Surf':                u('1502680390469-be75c86b636f'),
  'Tennis':              u('1554068865-24ceec13e1f9'),
  'Volleyball':          u('1592659762303-90081d34b277'),
  'Yoga':                u('1544367567-0f2fcb009e0b'),
};

export const SPORT_IMAGE_FALLBACK = u('1571902943202-507ec2618e8f');

export function getSportImage(sport?: string | null, coverImageUrl?: string | null): string {
  if (coverImageUrl) return coverImageUrl;
  if (sport && SPORT_IMAGES[sport]) return SPORT_IMAGES[sport];
  return SPORT_IMAGE_FALLBACK;
}
