/**
 * Upload Service - Handle image uploads to backend/Cloudinary
 */
import api from './api';

/**
 * Upload image to server (returns Cloudinary URL)
 * @param imageUri - Local file URI from ImagePicker
 * @returns Public URL from Cloudinary
 */
export const uploadChatImage = async (imageUri: string): Promise<string> => {
  try {
    console.log('📤 Uploading image:', imageUri.substring(0, 50) + '...');
    
    // Create FormData
    const formData = new FormData();
    
    // Get filename from URI
    const filename = imageUri.split('/').pop() || 'image.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    
    // Append image file
    formData.append('photo', {
      uri: imageUri,
      name: filename,
      type,
    } as any);
    
    // Upload to backend (will be stored in Cloudinary)
    const response = await api.post('/photos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000, // 30 seconds for upload
    });
    
    const apiData = (response as any).data;
    
    if (!apiData || !apiData.success || !apiData.data) {
      throw new Error(apiData?.error?.message || 'Upload failed');
    }
    
    const cloudinaryUrl = apiData.data.photo?.originalUrl || apiData.data.photo?.url;
    
    if (!cloudinaryUrl) {
      throw new Error('No image URL returned from server');
    }
    
    console.log('✅ Image uploaded successfully:', cloudinaryUrl);
    return cloudinaryUrl;
    
  } catch (error: any) {
    console.error('❌ Upload error:', error.message);
    throw new Error(error.message || 'Failed to upload image');
  }
};

/**
 * Upload multiple images
 * @param imageUris - Array of local file URIs
 * @returns Array of public URLs
 */
export const uploadChatImages = async (imageUris: string[]): Promise<string[]> => {
  try {
    console.log(`📤 Uploading ${imageUris.length} images...`);
    
    // Upload images in parallel (max 3 at a time to avoid overload)
    const uploadPromises: Promise<string>[] = [];
    
    for (let i = 0; i < imageUris.length; i++) {
      uploadPromises.push(uploadChatImage(imageUris[i]));
      
      // Wait every 3 images to avoid overwhelming server
      if ((i + 1) % 3 === 0) {
        await Promise.all(uploadPromises.slice(i - 2, i + 1));
      }
    }
    
    const urls = await Promise.all(uploadPromises);
    console.log(`✅ All ${urls.length} images uploaded successfully`);
    
    return urls;
    
  } catch (error: any) {
    console.error('❌ Batch upload error:', error.message);
    throw error;
  }
};

