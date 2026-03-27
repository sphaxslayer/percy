/**
 * GET /api/skills/todo-at-home/illustrations
 * Lists all available built-in illustration images grouped by room category.
 *
 * Returns two sets:
 * - Built-in (theme-adaptive): the 8 main rooms from public/images/contexts/
 * - Variants (fixed): alternate illustrations from public/images/_backups/
 *
 * The caller stores a specific URL in `imageUrl` to override theme adaptivity.
 */
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

// Human-readable French labels for each room slug
const ROOM_LABELS: Record<string, string> = {
  bathroom: 'Salle de bain',
  bedroom: 'Chambre',
  car: 'Voiture',
  garden: 'Jardin',
  house: 'Maison',
  kitchen: 'Cuisine',
  'living-room': 'Salon',
  office: 'Bureau',
};

interface IllustrationGroup {
  slug: string;
  label: string;
  /** Theme-adaptive images (both daylight + warm, resolved at render time via CSS) */
  main: { daylight: string; warm: string } | null;
  /** Fixed backup variants: each item has both themes for display purposes */
  variants: Array<{ id: string; daylight: string; warm: string }>;
}

export default defineEventHandler(async (event) => {
  // Auth required — no personal data returned, but we want consistency
  await requireUserId(event);

  const publicPath = join(process.cwd(), 'public');
  const groups: IllustrationGroup[] = [];

  // --- Main illustrations (theme-adaptive, stored in /images/contexts/{theme}/) ---
  const mainSlugs = Object.keys(ROOM_LABELS);
  for (const slug of mainSlugs) {
    const daylight = `/images/contexts/daylight/${slug}.webp`;
    const warm = `/images/contexts/warm/${slug}.webp`;
    groups.push({
      slug,
      label: ROOM_LABELS[slug] ?? slug,
      main: { daylight, warm },
      variants: [],
    });
  }

  // --- Backup variants (fixed images from /images/_backups/{theme}/) ---
  try {
    const backupDaylightDir = join(publicPath, 'images/_backups/daylight');
    const backupWarmDir = join(publicPath, 'images/_backups/warm');

    const [daylightFiles, warmFiles] = await Promise.all([
      readdir(backupDaylightDir).catch(() => [] as string[]),
      readdir(backupWarmDir).catch(() => [] as string[]),
    ]);

    // Build a map: variantId -> { daylight, warm }
    // daylight filename pattern: {slug}_daylight_img_{n}.webp
    // warm filename pattern: {slug}_img_{n}.webp
    const variantMap: Record<string, { daylight?: string; warm?: string }> = {};

    for (const file of daylightFiles) {
      // e.g. "bathroom_daylight_img_1.webp" -> slug="bathroom", n=1
      const match = file.match(/^(.+)_daylight_img_(\d+)\.webp$/);
      if (!match) continue;
      const slug = match[1];
      const n = match[2];
      const variantId = `${slug}_${n}`;
      variantMap[variantId] ??= {};
      variantMap[variantId].daylight = `/images/_backups/daylight/${file}`;
    }

    for (const file of warmFiles) {
      // e.g. "bathroom_img_1.webp" -> slug="bathroom", n=1
      const match = file.match(/^(.+)_img_(\d+)\.webp$/);
      if (!match) continue;
      const slug = match[1];
      const n = match[2];
      const variantId = `${slug}_${n}`;
      variantMap[variantId] ??= {};
      variantMap[variantId].warm = `/images/_backups/warm/${file}`;
    }

    // Attach variants to their groups
    for (const [variantId, paths] of Object.entries(variantMap)) {
      // slug is everything before the last "_n" suffix
      const underscoreIdx = variantId.lastIndexOf('_');
      const slug = variantId.slice(0, underscoreIdx);
      const group = groups.find((g) => g.slug === slug);
      if (!group) continue;
      // Only add when we have at least the daylight variant
      if (paths.daylight) {
        group.variants.push({
          id: variantId,
          daylight: paths.daylight,
          warm: paths.warm ?? paths.daylight,
        });
      }
    }

    // Sort variants by id within each group
    for (const group of groups) {
      group.variants.sort((a, b) => a.id.localeCompare(b.id));
    }
  } catch {
    // If _backups dir is missing, variants stay empty — graceful degradation
  }

  return { data: groups };
});
