// Upload.io configuration and utilities
export const UPLOADIO_CONFIG = {
  accountId: '223k2Hq',
  publicApiKey: 'public_223k2HqApvVZh5j1AZYw9p9GaDzy',
  get uploadUrl() {
    return `https://api.upload.io/v2/accounts/${this.accountId}/uploads/binary`;
  }
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
      const errorText = await response.text();
      console.error('Upload.io error response:', errorText);
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }

    const result: UploadioResponse = await response.json();
    return result.fileUrl;
  } catch (error) {
    console.error('Error uploading to Upload.io:', error);
    throw new Error('Failed to upload image. Please try again.');
  }
};