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