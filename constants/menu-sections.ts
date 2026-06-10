/**
 * Fixed menu section order for PDF and menu builder
 * This matches the exact order in the Onda PDF menu
 */
export const SECTION_ORDER = [
  { key: 'Sparkling', display: 'Sparkling' },
  { key: 'Sweet', display: 'Sweet' },
  { key: 'Rosé', display: 'Rosé' },
  { key: 'Non-alcoholic', display: 'Non-Alcoholic/Proxy' },
  { key: 'White', display: 'White' },
  { key: 'Orange/Skin Contact', display: 'White (Skin Contact)' },
  { key: 'Red', display: 'Red' },
] as const

/**
 * Sections that use a two-level hierarchy: Country → Region
 * All other sections use a single-level: Region only
 */
export const HIERARCHICAL_SECTIONS = [
  'White',
  'Orange/Skin Contact',
  'Red',
] as const

/**
 * Get the display name for a colour_style from the database
 */
export function getDisplayName(
  colourStyle: string
): string {
  const section = SECTION_ORDER.find((s) => s.key === colourStyle)
  return section?.display || colourStyle
}

/**
 * Check if a section uses two-level hierarchy
 */
export function isHierarchical(colourStyle: string): boolean {
  return (HIERARCHICAL_SECTIONS as readonly string[]).includes(colourStyle)
}

/**
 * Get section index for sorting
 */
export function getSectionIndex(colourStyle: string): number {
  const index = SECTION_ORDER.findIndex((s) => s.key === colourStyle)
  return index >= 0 ? index : SECTION_ORDER.length
}
