/**
 * Utility for mapping curve identifiers to GitHub raw content URLs
 */

/**
 * Represents a curve identifier and its corresponding URL
 */
export interface CurveIdentifier {
  id: string;
  url: string;
}

/**
 * Validates if a curve identifier is in valid format
 * @param identifier - The identifier to validate (e.g., "main" or "PR-123")
 * @returns true if valid, false otherwise
 */
export function validateCurveIdentifier(identifier: string): boolean {
  if (!identifier || typeof identifier !== 'string') {
    return false;
  }

  // Check if it's "main" (case-insensitive)
  if (identifier.toLowerCase() === 'main') {
    return true;
  }

  // Check if it matches "PR-###" format
  const prPattern = /^PR-\d+$/i;
  return prPattern.test(identifier);
}

/**
 * Maps a curve identifier to a GitHub raw content URL
 * @param identifier - The curve identifier ("main" or "PR-123")
 * @param env - The environment (e.g., "prod", "staging")
 * @param region - The region (e.g., "us-west", "eu-central")
 * @param owner - GitHub repository owner (default: "VaibhavDesai")
 * @param repo - GitHub repository name (default: "Load-predictor")
 * @returns URL to the curve JSON file
 * @throws Error if identifier is invalid
 */
export function mapCurveIdentifierToUrl(
  identifier: string,
  env: string,
  region: string,
  owner: string = 'VaibhavDesai',
  repo: string = 'Load-predictor'
): string {
  // Validate the identifier
  if (!validateCurveIdentifier(identifier)) {
    throw new Error(`Invalid curve identifier: ${identifier}. Use 'main' or 'PR-123'`);
  }

  const filename = `${env}_${region}.json`;
  const baseUrl = `https://raw.githubusercontent.com/${owner}/${repo}`;

  // Handle "main" branch (case-insensitive)
  if (identifier.toLowerCase() === 'main') {
    return `${baseUrl}/main/data/curves/${filename}`;
  }

  // Handle "PR-###" format
  const prMatch = identifier.match(/^PR-(\d+)$/i);
  if (prMatch) {
    const prNumber = prMatch[1];
    return `${baseUrl}/refs/pull/${prNumber}/head/data/curves/${filename}`;
  }

  // This should never be reached if validateCurveIdentifier works correctly
  throw new Error(`Invalid curve identifier: ${identifier}. Use 'main' or 'PR-123'`);
}
