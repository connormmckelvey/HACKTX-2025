import { supabase, TABLES, STORAGE_BUCKETS } from '../config/supabase';
import * as FileSystem from 'expo-file-system/legacy';

export class PhotoService {
  /**
   * Upload a photo to Supabase Storage and create metadata record
   * @param {Object} photoData - Photo data object
   * @param {string} photoData.uri - Local file URI
   * @param {number} photoData.latitude - Photo latitude
   * @param {number} photoData.longitude - Photo longitude
   * @param {string[]} photoData.constellation - Array of constellation names (empty for future AI analysis)
   * @param {number} photoData.lightRating - Light pollution rating (1-5)
   * @param {Date} photoData.takenAt - When photo was taken
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  static async uploadPhoto(photoData) {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Generate unique filename
      const fileExt = photoData.uri.split('.').pop() || 'jpg';
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      let uploadData;
      let uploadError;

      // Handle camera URIs (file://) vs web URLs (http/https)
      if (photoData.uri.startsWith('file://')) {
        try {
          // For local file URIs (camera photos), use a different approach
          console.log('Processing camera file...');

          // Try to read the file directly as a buffer
          console.log('Attempting to read camera file...');

          // Read as base64 using FileSystem
          console.log('Attempting to read file as base64...');
          let base64;

          try {
            // Try with string encoding first (simpler approach)
            console.log('Trying base64 string encoding...');
            base64 = await FileSystem.readAsStringAsync(photoData.uri, {
              encoding: 'base64',
            });
          } catch (stringError) {
            console.log('String encoding failed, trying without encoding...');
            try {
              // Try without encoding parameter
              const rawContent = await FileSystem.readAsStringAsync(photoData.uri);
              // If we get raw content, it might already be base64 or we need to handle it differently
              console.log('Raw content length:', rawContent.length);
              // For now, assume it's already base64 or throw an error
              if (rawContent.match(/^[A-Za-z0-9+/]*={0,2}$/)) {
                // Looks like base64
                base64 = rawContent;
              } else {
                throw new Error('Unable to read file as base64');
              }
            } catch (rawError) {
              console.log('All encoding methods failed');
              throw new Error(`Failed to read camera file: ${stringError.message} | ${rawError.message}`);
            }
          }

          // Convert base64 to Uint8Array for Supabase upload
          const binaryString = atob(base64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          console.log('Uploading camera photo to Supabase...');
          // Upload to Supabase Storage
          const uploadResult = await supabase.storage
            .from(STORAGE_BUCKETS.USER_PHOTOS)
            .upload(fileName, bytes, {
              contentType: `image/${fileExt}`,
              upsert: false,
            });

          uploadData = uploadResult.data;
          uploadError = uploadResult.error;
        } catch (fileError) {
          console.error('Error processing camera file:', fileError);
          throw new Error(`Failed to process camera image: ${fileError.message}`);
        }
      } else {
        try {
          // For web URLs, use the original blob approach
          console.log('Uploading web URL...');
          const response = await fetch(photoData.uri);

          if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
          }

          const blob = await response.blob();

          const uploadResult = await supabase.storage
            .from(STORAGE_BUCKETS.USER_PHOTOS)
            .upload(fileName, blob, {
              contentType: `image/${fileExt}`,
              upsert: false,
            });

          uploadData = uploadResult.data;
          uploadError = uploadResult.error;
        } catch (urlError) {
          console.error('Error uploading web URL:', urlError);
          throw new Error(`Failed to upload image from URL: ${urlError.message}`);
        }
      }

      if (uploadError) throw uploadError;

      // Create photo metadata record
      const { data: photoRecord, error: recordError } = await supabase
        .from(TABLES.PHOTOS)
        .insert({
          user_id: userId,
          storage_path: uploadData.path,
          latitude: photoData.latitude,
          longitude: photoData.longitude,
          constellation: photoData.constellation || [], // Ensure it's an array
          light_rating: photoData.lightRating,
          taken_at: photoData.takenAt?.toISOString() || new Date().toISOString(),
        })
        .select()
        .single();

      if (recordError) throw recordError;

      return { data: photoRecord, error: null };
    } catch (error) {
      console.error('Photo upload error:', error);
      return { data: null, error };
    }
  }

  /**
   * Get all photos for the current user
   * @returns {Promise<{data: Array|null, error: Error|null}>}
   */
  static async getUserPhotos() {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from(TABLES.PHOTOS)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Get user photos error:', error);
      return { data: null, error };
    }
  }

  /**
   * Get a signed URL for viewing a photo
   * @param {string} storagePath - Path to the photo in storage
   * @param {number} expiresIn - URL expiration time in seconds (default: 3600)
   * @returns {Promise<{data: string|null, error: Error|null}>}
   */
  static async getPhotoUrl(storagePath, expiresIn = 3600) {
    try {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKETS.USER_PHOTOS)
        .createSignedUrl(storagePath, expiresIn);

      if (error) throw error;

      return { data: data.signedUrl, error: null };
    } catch (error) {
      console.error('Get photo URL error:', error);
      return { data: null, error };
    }
  }

  /**
   * Delete a photo and its metadata
   * @param {string} photoId - Photo ID to delete
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  static async deletePhoto(photoId) {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // First get the photo record to get the storage path
      const { data: photo, error: fetchError } = await supabase
        .from(TABLES.PHOTOS)
        .select('storage_path')
        .eq('id', photoId)
        .eq('user_id', userId)
        .single();

      if (fetchError) throw fetchError;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(STORAGE_BUCKETS.USER_PHOTOS)
        .remove([photo.storage_path]);

      if (storageError) throw storageError;

      // Delete metadata record
      const { data, error: deleteError } = await supabase
        .from(TABLES.PHOTOS)
        .delete()
        .eq('id', photoId)
        .eq('user_id', userId)
        .select();

      if (deleteError) throw deleteError;

      return { data, error: null };
    } catch (error) {
      console.error('Delete photo error:', error);
      return { data: null, error };
    }
  }

  /**
   * Update photo metadata
   * @param {string} photoId - Photo ID to update
   * @param {Object} updates - Fields to update
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  static async updatePhoto(photoId, updates) {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from(TABLES.PHOTOS)
        .update(updates)
        .eq('id', photoId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Update photo error:', error);
      return { data: null, error };
    }
  }

  /**
   * Get photos by constellation
   * @param {string} constellation - Constellation name to search for
   * @returns {Promise<{data: Array|null, error: Error|null}>}
   */
  static async getPhotosByConstellation(constellation) {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Validate constellation parameter
      if (!constellation || typeof constellation !== 'string') {
        throw new Error('Constellation parameter must be a non-empty string');
      }

      const { data, error } = await supabase
        .from(TABLES.PHOTOS)
        .select('*')
        .eq('user_id', userId)
        .contains('constellation', [constellation]) // Search within the array
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Get photos by constellation error:', error);
      return { data: null, error };
    }
  }

  /**
   * Update constellation detection results for a photo (for future AI analysis)
   * @param {string} photoId - Photo ID to update
   * @param {string[]} constellations - Array of detected constellation names
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  static async updateConstellationDetection(photoId, constellations) {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Ensure constellations is an array
      const constellationArray = Array.isArray(constellations) ? constellations : [];

      const { data, error } = await supabase
        .from(TABLES.PHOTOS)
        .update({ constellation: constellationArray })
        .eq('id', photoId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Update constellation detection error:', error);
      return { data: null, error };
    }
  }
}
