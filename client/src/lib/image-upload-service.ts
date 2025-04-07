/**
 * Image Upload Service
 * Handles uploading images to the server
 */

/**
 * Upload an image to the server
 * @param file The image file to upload
 * @returns Promise resolving to the image path on the server
 */
export async function uploadImage(file: File): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await fetch('/api/upload-image', {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header, let the browser set it with the correct boundary
      credentials: 'include' // Include cookies for authentication
    });
    
    if (!response.ok) {
      let errorMessage = 'Failed to upload image';
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // Ignore JSON parse errors
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    return data.imagePath;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

/**
 * Validate an image file before upload
 * @param file The file to validate
 * @returns An error message if invalid, or null if valid
 */
export function validateImageFile(file: File): string | null {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return 'Please select an image file (JPEG, PNG, GIF, etc.)';
  }
  
  // Check file size (5MB limit)
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > MAX_SIZE) {
    return 'Image size should be less than 5MB';
  }
  
  return null; // No validation errors
}