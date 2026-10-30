/**
 * CampusFix Duplicate Detection Utility
 * Computes text similarity and location proximity between complaints
 * Compares:
 * 1. Complaint description and title
 * 2. Complaint location tokens
 * 3. Open complaint status (Pending or In Progress)
 */

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
  'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
  'to', 'was', 'were', 'will', 'with', 'there', 'here', 'near', 'floor',
  'room', 'block', 'hostel', 'please', 'help', 'not', 'very', 'having'
]);

/**
 * Tokenize string into filtered words
 */
export const tokenize = (str = '') => {
  if (!str) return [];
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 2 && !STOP_WORDS.has(token));
};

/**
 * Jaccard similarity between two sets of tokens
 */
export const jaccardSimilarity = (tokensA, tokensB) => {
  if (!tokensA.length || !tokensB.length) return 0;
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);

  let intersectionCount = 0;
  setA.forEach(item => {
    if (setB.has(item)) intersectionCount++;
  });

  const unionCount = new Set([...setA, ...setB]).size;
  return unionCount === 0 ? 0 : intersectionCount / unionCount;
};

/**
 * Normalized Levenshtein distance similarity
 */
export const levenshteinSimilarity = (str1 = '', str2 = '') => {
  const s1 = str1.trim().toLowerCase();
  const s2 = str2.trim().toLowerCase();
  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;

  const len1 = s1.length;
  const len2 = s2.length;
  const track = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(null));

  for (let i = 0; i <= len1; i += 1) track[0][i] = i;
  for (let j = 0; j <= len2; j += 1) track[j][0] = j;

  for (let j = 1; j <= len2; j += 1) {
    for (let i = 1; i <= len1; i += 1) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // deletion
        track[j - 1][i] + 1, // insertion
        track[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  const distance = track[len2][len1];
  const maxLen = Math.max(len1, len2);
  return Math.max(0, 1 - distance / maxLen);
};

/**
 * Normalize and compare locations
 * e.g. "Hostel Block B, Floor 3" vs "Hostel Block B, 3rd Floor"
 */
export const compareLocations = (locA = '', locB = '') => {
  if (!locA || !locB) return { isMatch: false, score: 0 };
  const cleanA = locA.toLowerCase().replace(/[^a-z0-9]/g, ' ');
  const cleanB = locB.toLowerCase().replace(/[^a-z0-9]/g, ' ');

  if (cleanA === cleanB) return { isMatch: true, score: 1.0 };

  const tokensA = cleanA.split(/\s+/).filter(Boolean);
  const tokensB = cleanB.split(/\s+/).filter(Boolean);

  let shared = 0;
  tokensA.forEach(t => {
    if (tokensB.includes(t)) shared++;
  });

  const union = new Set([...tokensA, ...tokensB]).size;
  const score = union === 0 ? 0 : shared / union;
  return {
    isMatch: score >= 0.5,
    score
  };
};

/**
 * Calculate duplicate probability between two complaints
 */
export const calculateComplaintSimilarity = (c1, c2) => {
  if (c1.id === c2.id) return { score: 1.0, isDuplicate: false, reason: 'Same complaint' };

  // Text tokens
  const text1 = `${c1.title} ${c1.description}`;
  const text2 = `${c2.title} ${c2.description}`;

  const tokens1 = tokenize(text1);
  const tokens2 = tokenize(text2);

  const jaccard = jaccardSimilarity(tokens1, tokens2);
  const titleLev = levenshteinSimilarity(c1.title, c2.title);

  // Location comparison
  const locComparison = compareLocations(c1.location, c2.location);

  // Category match bonus
  const categoryMatch = (c1.category && c2.category && c1.category.toLowerCase() === c2.category.toLowerCase());

  // Weighted scoring
  let totalScore = (jaccard * 0.45) + (titleLev * 0.25) + (locComparison.score * 0.30);
  if (categoryMatch) {
    totalScore = Math.min(1.0, totalScore + 0.05);
  }

  // Find shared keywords for UI highlighting
  const set2 = new Set(tokens2);
  const sharedKeywords = tokens1.filter(t => set2.has(t)).slice(0, 6);

  const isDuplicate = totalScore >= 0.50 || (locComparison.isMatch && jaccard >= 0.35);

  let confidence = 'Low';
  if (totalScore >= 0.80) confidence = 'Very High';
  else if (totalScore >= 0.65) confidence = 'High';
  else if (totalScore >= 0.50) confidence = 'Moderate';

  return {
    score: Math.round(totalScore * 100),
    isDuplicate,
    confidence,
    locationMatched: locComparison.isMatch,
    categoryMatched: categoryMatch,
    sharedKeywords,
    complaintA: c1,
    complaintB: c2
  };
};

/**
 * Scan an entire list of complaints to find duplicate candidate pairs
 * Only focuses on Open complaints (Pending / In Progress)
 */
export const detectDuplicateComplaints = (complaintsList = []) => {
  const openComplaints = complaintsList.filter(c => c.status !== 'Resolved' && c.status !== 'Closed');
  const duplicatePairs = [];
  const processedKeys = new Set();

  for (let i = 0; i < openComplaints.length; i++) {
    for (let j = i + 1; j < openComplaints.length; j++) {
      const c1 = openComplaints[i];
      const c2 = openComplaints[j];
      const pairKey = [c1.id, c2.id].sort().join(':::');

      if (!processedKeys.has(pairKey)) {
        processedKeys.add(pairKey);
        const result = calculateComplaintSimilarity(c1, c2);
        if (result.isDuplicate) {
          duplicatePairs.push({
            id: `dup-${c1.id}-${c2.id}`,
            score: result.score,
            confidence: result.confidence,
            locationMatched: result.locationMatched,
            categoryMatched: result.categoryMatched,
            sharedKeywords: result.sharedKeywords,
            primaryComplaint: c1.createdAt <= c2.createdAt ? c1 : c2,
            duplicateCandidate: c1.createdAt > c2.createdAt ? c1 : c2
          });
        }
      }
    }
  }

  return duplicatePairs.sort((a, b) => b.score - a.score);
};

/**
 * Find if a single complaint has potential duplicates among all open complaints
 */
export const findDuplicatesForComplaint = (targetComplaint, allComplaints = []) => {
  if (!targetComplaint) return [];
  const openComplaints = allComplaints.filter(c => 
    String(c.id) !== String(targetComplaint.id) && 
    c.status !== 'Resolved'
  );

  const matches = [];
  openComplaints.forEach(other => {
    const sim = calculateComplaintSimilarity(targetComplaint, other);
    if (sim.isDuplicate) {
      matches.push({
        relatedId: other.id,
        relatedComplaint: other,
        score: sim.score,
        confidence: sim.confidence,
        locationMatched: sim.locationMatched,
        sharedKeywords: sim.sharedKeywords
      });
    }
  });

  return matches.sort((a, b) => b.score - a.score);
};
