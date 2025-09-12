// Simple word tokenizer
function tokenize(text) {
  return text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2); // Remove short words
}

// Calculate Jaccard similarity (intersection over union)
function jaccardSimilarity(text1, text2) {
  const set1 = new Set(tokenize(text1));
  const set2 = new Set(tokenize(text2));
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}

// Calculate word overlap percentage
function wordOverlapSimilarity(text1, text2) {
  const words1 = tokenize(text1);
  const words2 = tokenize(text2);
  
  if (words1.length === 0 || words2.length === 0) return 0;
  
  let matches = 0;
  const set2 = new Set(words2);
  
  words1.forEach(word => {
    if (set2.has(word)) matches++;
  });
  
  return matches / Math.max(words1.length, words2.length);
}

// Calculate cosine similarity using word frequency
function cosineSimilarity(text1, text2) {
  const words1 = tokenize(text1);
  const words2 = tokenize(text2);
  
  // Get unique words from both texts
  const allWords = [...new Set([...words1, ...words2])];
  
  // Create frequency vectors
  const vector1 = allWords.map(word => words1.filter(w => w === word).length);
  const vector2 = allWords.map(word => words2.filter(w => w === word).length);
  
  // Calculate dot product
  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;
  
  for (let i = 0; i < vector1.length; i++) {
    dotProduct += vector1[i] * vector2[i];
    magnitude1 += vector1[i] * vector1[i];
    magnitude2 += vector2[i] * vector2[i];
  }
  
  if (magnitude1 === 0 || magnitude2 === 0) return 0;
  
  return dotProduct / (Math.sqrt(magnitude1) * Math.sqrt(magnitude2));
}

// Main relevance scoring function
async function getRelevanceScore(prompt, answer) {
  if (!prompt || !answer) return 0;
  
  // Use multiple similarity methods and average them
  const jaccard = jaccardSimilarity(prompt, answer);
  const overlap = wordOverlapSimilarity(prompt, answer);
  const cosine = cosineSimilarity(prompt, answer);
  
  // Weighted average (cosine similarity tends to work best)
  return (cosine * 0.5) + (jaccard * 0.3) + (overlap * 0.2);
}

module.exports = { getRelevanceScore };
