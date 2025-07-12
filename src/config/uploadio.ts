// Upload.io configuration and utilities
export const UPLOADIO_CONFIG = {
  // Replace with your actual Upload.io account ID and public API key
  accountId: '223k2Hq', // Replace with your actual account ID
  publicApiKey: 'public_223k2HqApvVZh5j1AZYw9p9GaDzy', // Replace with your actual public API key
  uploadUrl: 'https://api.upload.io/v2/accounts/223k2Hq/uploads/binary' // Replace account ID
};

export interface UploadioResponse {
  fileUrl: string;
  filePath: string;
  accountId: string;
  originalFileName: string;
  mime: string;
  size: number;
  lastModified: number;
  tags: string[];
}

export const uploadImageToUploadio = async (file: File): Promise<string> => {
  try {
    const response = await fetch(UPLOADIO_CONFIG.uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${UPLOADIO_CONFIG.publicApiKey}`,
        'Content-Type': file.type
      },
      body: file
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const result: UploadioResponse = await response.json();
    return result.fileUrl;
  } catch (error) {
    console.error('Error uploading to Upload.io:', error);
    throw new Error('Failed to upload image. Please try again.');
  }
};