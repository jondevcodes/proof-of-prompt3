import { sha256, toUtf8Bytes } from "ethers";

/**
 * Normalizes and hashes prompt+response content
 * @param prompt - User input prompt
 * @param response - AI-generated response
 * @returns Hex-encoded SHA-256 hash
 */
export function hashContent(prompt: string, response: string): string {
  // Normalize whitespace and casing
  const normalizedPrompt = prompt.trim().toLowerCase();
  const normalizedResponse = response.trim().toLowerCase();
  
  // Create deterministic payload
  const payload = JSON.stringify({
    p: normalizedPrompt,
    r: normalizedResponse
  });
  
  // Generate SHA-256 hash
  return sha256(toUtf8Bytes(payload));
}

/**
 * Generates a hash from raw prompt and response without normalization
 * @param prompt - User input prompt
 * @param response - AI-generated response
 * @returns Hex-encoded SHA-256 hash
 */
export function hashRawContent(prompt: string, response: string): string {
  const payload = `${prompt}${response}`;
  return sha256(toUtf8Bytes(payload));
}

/**
 * Verifies if a hash matches the given prompt and response
 * @param hash - The hash to verify
 * @param prompt - User input prompt
 * @param response - AI-generated response
 * @returns Boolean indicating if the hash is valid
 */
export function verifyHash(hash: string, prompt: string, response: string): boolean {
  const expectedHash = hashRawContent(prompt, response);
  return hash.toLowerCase() === expectedHash.toLowerCase();
}