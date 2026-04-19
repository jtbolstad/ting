export const ORG_TYPES = ['neighborhood', 'school', 'company', 'friends'] as const;
export type OrgType = typeof ORG_TYPES[number];

export const ORG_TYPE_LABELS: Record<OrgType, string> = {
  neighborhood: 'Neighborhood',
  school: 'School / Makerspace',
  company: 'Company / Workshop',
  friends: 'Friend Group',
};

export const ORG_NAME_SUGGESTIONS: Record<OrgType, string[]> = {
  neighborhood: [
    'Grünerløkka Tool Library',
    'Frogner Lending Library',
    'Majorstuen Community Tools',
    'Nordre Aker Tool Share',
  ],
  school: [
    'Oslo High School Makerspace',
    'Blindern Campus Tools',
    'Engineering Dept Workshop',
    'Student Makerspace',
  ],
  company: [
    'Acme Corp Workshop',
    'The Office Tool Library',
    'Startup Hub Equipment Share',
    'HQ Maker Room',
  ],
  friends: [
    'The Woodworking Crew',
    'Weekend Warriors',
    'DIY Collective',
    'Tool Buddies',
  ],
};

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}
