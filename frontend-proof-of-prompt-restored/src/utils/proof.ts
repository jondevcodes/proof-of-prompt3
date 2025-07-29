import { ethers } from 'ethers';

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
  return ethers.utils.sha256(ethers.utils.toUtf8Bytes(payload));
}