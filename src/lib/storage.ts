// lib/storage.ts
import { supabase } from './supabase';

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB in bytes
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const BUCKET_NAME = 'candidates';

export interface UploadError {
  message: string;
  code?: string;
}

export async function uploadCandidateImage(
  file: File,
  roomId: string
): Promise<{ url: string } | UploadError> {
  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      message: 'File size exceeds 1MB limit',
      code: 'FILE_TOO_LARGE',
    };
  }

  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      message: 'Only JPEG, PNG, and WebP images are allowed',
      code: 'INVALID_FILE_TYPE',
    };
  }

  try {
    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const filename = `${roomId}/${timestamp}-${random}-${file.name}`;

    // Upload to Supabase
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filename, file);

    if (error) {
      return {
        message: error.message || 'Failed to upload image',
        code: error.name,
      };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path);

    return { url: publicUrl };
  } catch (error) {
    return {
      message: 'An error occurred during upload',
      code: 'UPLOAD_ERROR',
    };
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}