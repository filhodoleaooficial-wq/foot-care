import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const CONTENT_FILES_PREFIX = `/storage/v1/object/public/content-files/`;

/**
 * Extracts the storage path from a full public URL for content-files bucket.
 * Returns null if the URL is not a content-files URL.
 */
export function extractContentFilePath(url: string): string | null {
  if (!url) return null;
  
  // Check if it's a content-files public URL
  const idx = url.indexOf(CONTENT_FILES_PREFIX);
  if (idx !== -1) {
    return decodeURIComponent(url.substring(idx + CONTENT_FILES_PREFIX.length));
  }
  
  return null;
}

/**
 * Returns a signed URL for content-files, or the original URL if it's external.
 */
export async function getContentUrl(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  
  const path = extractContentFilePath(url);
  if (!path) {
    // Not a content-files URL, return as-is (external link, YouTube, etc.)
    return url;
  }
  
  try {
    const { data, error } = await supabase.functions.invoke("get-signed-url", {
      body: { path },
    });
    if (error) throw error;
    return data?.signedUrl || null;
  } catch {
    console.error("Failed to get signed URL for:", path);
    return null;
  }
}
