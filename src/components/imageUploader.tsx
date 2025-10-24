// components/ImageUploader.tsx
'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Upload, X, Loader2, AlertCircle } from 'lucide-react';
import { uploadCandidateImage, formatFileSize, type UploadError } from '@/lib/storage';

interface ImageUploaderProps {
  roomId: string;
  onImageUploaded: (url: string) => void;
  disabled?: boolean;
  existingUrl?: string;
}

export function ImageUploader({
  roomId,
  onImageUploaded,
  disabled = false,
  existingUrl,
}: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(existingUrl || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Show preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    setUploading(true);
    const result = await uploadCandidateImage(file, roomId);

    if ('message' in result) {
      const uploadError = result as UploadError;
      setError(uploadError.message);
      setPreview(null);
    } else {
      onImageUploaded(result.url);
    }

    setUploading(false);
  };

  const handleRemove = () => {
    setPreview(null);
    setError(null);
    onImageUploaded('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <Label>Candidate Photo (Optional)</Label>

      <Card className="border-dashed dark:border-slate-700">
        {preview ? (
          <div className="relative w-full h-40 bg-slate-100 dark:bg-slate-800">
            <Image
              src={preview}
              alt="Preview"
              fill
              className="object-cover rounded-md"
              sizes="100vw"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleRemove}
              disabled={uploading}
              className="absolute top-2 right-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="p-8 text-center">
            <Upload className="w-8 h-8 mx-auto mb-3 text-slate-400 dark:text-slate-600" />
            <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">
              Click to upload image
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              JPEG, PNG or WebP • Max 1MB
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              disabled={disabled || uploading}
              className="hidden"
            />
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || uploading}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Choose File
                </>
              )}
            </Button>
          </div>
        )}
      </Card>

      {error && (
        <div className="flex gap-2 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}
    </div>
  );
}