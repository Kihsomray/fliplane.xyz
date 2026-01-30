export interface UserImage {
  id: string;
  user_id: string;
  original_filename: string;
  storage_key: string;
  processed_storage_key: string | null;
  public_url: string | null;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface UploadResponse {
  success: boolean;
  image?: UserImage;
  error?: string;
}

export interface ImagesListResponse {
  success: boolean;
  images?: UserImage[];
  error?: string;
}

export interface DeleteResponse {
  success: boolean;
  error?: string;
}
