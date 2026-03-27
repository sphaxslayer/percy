/**
 * POST /api/skills/todo-at-home/upload
 * Handles custom illustration image upload for a context card.
 *
 * Accepts multipart/form-data with a single "image" file field.
 * Stores the file in public/images/uploads/{userId}/ and returns the public URL.
 *
 * Limits: 5 MB, JPEG/PNG/WebP only.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { randomUUID } from 'node:crypto';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event);

  // Parse multipart form data
  const formData = await readFormData(event);
  const file = formData.get('image');

  if (!file || !(file instanceof File)) {
    throw createError({ statusCode: 400, message: 'Champ "image" manquant ou invalide' });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw createError({
      statusCode: 400,
      message: 'Format non supporté. Utilisez JPEG, PNG ou WebP.',
    });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  if (buffer.byteLength > MAX_FILE_SIZE) {
    throw createError({ statusCode: 400, message: 'Image trop volumineuse (max 5 Mo)' });
  }

  // Determine file extension from MIME type (ignore the original filename extension
  // to avoid path traversal or spoofing)
  const extByMime: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
  };
  const ext = extByMime[file.type] ?? extname(file.name) ?? '.jpg';

  // Store in public/images/uploads/{userId}/{uuid}{ext}
  const uploadDir = join(process.cwd(), 'public', 'images', 'uploads', userId);
  await mkdir(uploadDir, { recursive: true });

  const filename = `${randomUUID()}${ext}`;
  const filePath = join(uploadDir, filename);
  await writeFile(filePath, buffer);

  const publicUrl = `/images/uploads/${userId}/${filename}`;
  return { data: { url: publicUrl } };
});
