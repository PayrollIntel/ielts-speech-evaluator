// bandScorer.js - Enhanced IELTS Band Scoring Engine
const DESCRIPTORS = require('./ieltsDescriptors.json');

// Advanced metrics calculation with pronunciation integration
function calculateAdvancedMetrics(text) {
  const words = text.trim().split(/\s+/).filter(word => word.length > 0);
  const sentences = text.split(/[.!?]+/).filter(Boolean);
  const uniqueWords = new Set(words.map(w => w.toLowerCase()));
  
  // Fluency metrics
  const pauseMarkers = (text.match(/\b(um|uh|er|ah|hmm|well|like|you know)\b/gi) || []).length;
  const repetitionMarkers = (text.match(/\b(\w+)\s+\1\b/gi) || []).length;
  const selfCorrectionMarkers = (text.match(/\b(sorry|I mean|actually|wait|let me|what I meant)\b/gi) || []).length;
  
  // Discourse markers and connectives
  const basicConnectives = (text.match(/\b(and|but|so|then|because|first|second|finally)\b/gi) || []).length;
  const advancedConnectives = (text.match(/\b(however|moreover|furthermore|nevertheless|consequently|therefore|in addition|on the other hand|as a result)\b/gi) || []).length;
  
  // Vocabulary complexity analysis
  const commonWords = words.filter(word => 
    /^(the|is|are|was|were|have|has|had|do|does|did|will|would|can|could|should|may|might|this|that|these|those|in|on|at|to|for|of|with|by)$/i.test(word)
  ).length;
  
  const lessCommonWords = words.filter(word => 
    word.length > 6 && 
    !/^(the|is|are|was|were|have|has|had|do|does|did|will|would|can|could|should|may|might)$/i.test(word) &&
    /^[a-zA-Z]+$/.test(word)
  ).length;
  
  // Idiomatic expressions and collocations
  const idiomaticExpressions = (text.match(/\b(break the ice|piece of cake|it's raining cats and dogs|time flies|hit the books|catch up|look forward to|take care of|make sure|in my opinion|as far as I'm concerned)\b/gi) || []).length;
  
  // Grammar complexity indicators
  const simplePresent = (text.match(/\b(am|is|are)\s+\w+ing\b/gi) || []).length;
  const complexTenses = (text.match(/\b(have been|had been|will have|would have|could have|should have|might have)\b/gi) || []).length;
  const subordinateClauses = (text.match(/\b(which|that|who|whom|whose|when|where|why|although|though|while|since|if|unless|until|before|after)\b/gi) || []).length;
  const conditionals = (text.match(/\bif\s+\w+.*would|were.*would|had.*would\b/gi) || []).length;
  const passiveVoice = (text.match(/\b(is|are|was|were|been|being)\s+(being\s+)?\w+ed\b/gi) || []).length;
  
  return {
    wordCount: words.length,
    sentenceCount: sentences.length,
    uniqueWordCount: uniqueWords.size,
    typeTokenRatio: uniqueWords.size / Math.max(words.length, 1),
    avgWordsPerSentence: words.length / Math.max(sentences.length, 1),
    
    // Fluency indicators
    pauseMarkers,
    repetitionMarkers,
    selfCorrectionMarkers,
    fluencyScore: Math.max(0, 1 - (pauseMarkers * 0.1 + repetitionMarkers * 0.2 + selfCorrectionMarkers * 0.1) / Math.max(words.length * 0.05, 1)),
    
    // Coherence indicators
    basicConnectives,
    advancedConnectives,
    coherenceScore: Math.min(1, (basicConnectives * 0.5 + advancedConnectives * 1.5) / Math.max(sentences.length * 0.3, 1)),
    
    // Lexical resource indicators
    lessCommonWords,
    idiomaticExpressions,
    lexicalDiversity: Math.min(1, uniqueWords.size / Math.max(words.length * 0.6, 1)),
    vocabularyScore: Math.min(1, (lessCommonWords * 1.5 + idiomaticExpressions * 2 + uniqueWords.size * 0.5) / Math.max(words.length, 1)),
    
    // Grammar indicators
    simplePresent,
    complexTenses,
    subordinateClauses,
    conditionals,
    passiveVoice,
    grammarComplexity: Math.min(1, (complexTenses * 2 + subordinateClauses * 1.5 + conditionals * 2 + passiveVoice * 1.2) / Math.max(sentences.length, 1))
  };
}

function scoreToBand(score) {
  if (score >= 0.95) return 9;
  if (score >= 0.88) return 8.5;
  if (score >= 0.82) return 8;
  if (score >= 0.78) return 7.5;
  if (score >= 0.72) return 7;
  if (score >= 0.68) return 6.5;
  if (score >= 0.62) return 6;
  if (score >= 0.58) return 5.5;
  if (score >= 0.52) return 5;
  if (score >= 0.48) return 4.5;
  if (score >= 0.42) return 4;
  if (score >= 0.38) return 3.5;
  if (score >= 0.32) return 3;
  if (score >= 0.28) return 2.5;
  if (score >= 0.22) return 2;
  if (score >= 0.18) return 1.5;
  return 1;
}

function calculateFluencyBand(metrics, grammarErrors) {
  let fluencyScore = metrics.fluencyScore;
  
  // Adjust based on speech length
  if (metrics.wordCount < 30) fluencyScore *= 0.6; // Too short responses
  if (metrics.wordCount < 50) fluencyScore *= 0.8;
  if (metrics.wordCount > 200) fluencyScore *= 1.1; // Reward longer responses
  
  // Sentence length variety
  if (metrics.avgWordsPerSentence > 25) fluencyScore *= 0.9; // Run-on sentences
  if (metrics.avgWordsPerSentence < 6) fluencyScore *= 0.8; // Too simple
  if (metrics.avgWordsPerSentence >= 8 && metrics.avgWordsPerSentence <= 20) fluencyScore *= 1.1; // Good range
  
  // Coherence integration
  fluencyScore = (fluencyScore * 0.7 + metrics.coherenceScore * 0.3);
  
  // Penalty for excessive errors that affect fluency
  if (grammarErrors.length > metrics.wordCount * 0.1) {
    fluencyScore *= 0.8;
  }
  
  return scoreToBand(Math.max(0, Math.min(1, fluencyScore)));
}

function calculateLexicalBand(metrics) {
  let lexicalScore = metrics.vocabularyScore;
  
  // Reward lexical diversity
  if (metrics.typeTokenRatio > 0.7) lexicalScore *= 1.2;
  if (metrics.typeTokenRatio > 0.5) lexicalScore *= 1.1;
  if (metrics.typeTokenRatio < 0.3) lexicalScore *= 0.7;
  
  // Bonus for idiomatic expressions
  if (metrics.idiomaticExpressions > 0) {
    lexicalScore += 0.1 * Math.min(metrics.idiomaticExpressions, 3);
  }
  
  // Consider word length and sophistication
  const sophisticationBonus = Math.min(0.2, metrics.lessCommonWords / Math.max(metrics.wordCount, 1));
  lexicalScore += sophisticationBonus;
  
  return scoreToBand(Math.max(0, Math.min(1, lexicalScore)));
}

function calculateGrammarBand(metrics, grammarErrors) {
  const errorRate = grammarErrors.length / Math.max(metrics.wordCount * 0.05, 1);
  let grammarScore = Math.max(0, 1 - errorRate);
  
  // Reward complex grammar usage
  grammarScore = (grammarScore * 0.6 + metrics.grammarComplexity * 0.4);
  
  // Specific bonuses for advanced structures
  if (metrics.conditionals > 0) grammarScore += 0.05;
  if (metrics.passiveVoice > 0) grammarScore += 0.03;
  if (metrics.subordinateClauses > 2) grammarScore += 0.05;
  
  // Penalty for no complex structures with longer responses
  if (metrics.wordCount > 100 && metrics.grammarComplexity < 0.1) {
    grammarScore *= 0.7;
  }
  
  return scoreToBand(Math.max(0, Math.min(1, grammarScore)));
}

function calculatePronunciationBand(metrics, pronunciationAnalysis = null) {
  if (pronunciationAnalysis) {
    // Use actual pronunciation analysis
    const avgScore = (
      pronunciationAnalysis.stressAccuracy + 
      pronunciationAnalysis.intonationNaturalness + 
      pronunciationAnalysis.rhythmFluency + 
      pronunciationAnalysis.pronunciationClarity
    ) / 4;
    
    return scoreToBand(avgScore);
  }
  
  // Estimate based on text complexity (fallback)
  let pronunciationScore = 0.7; // Base score
  
  // Adjust based on text sophistication
  if (metrics.vocabularyScore > 0.8) pronunciationScore += 0.05;
  if (metrics.grammarComplexity > 0.6) pronunciationScore += 0.05;
  if (metrics.wordCount > 150) pronunciationScore += 0.05;
  
  // Penalty for very simple responses
  if (metrics.wordCount < 50) pronunciationScore -= 0.1;
  if (metrics.typeTokenRatio < 0.3) pronunciationScore -= 0.05;
  
  return scoreToBand(Math.max(0.3, Math.min(1, pronunciationScore)));
}

function calculateBands(grammarErrors, text, pronunciationAnalysis = null) {
  const metrics = calculateAdvancedMetrics(text);
  
  const fluencyBand = calculateFluencyBand(metrics, grammarErrors);
  const lexicalBand = calculateLexicalBand(metrics);
  const grammarBand = calculateGrammarBand(metrics, grammarErrors);
  const pronunciationBand = calculatePronunciationBand(metrics, pronunciationAnalysis);
  
  const overallBand = Math.round(((fluencyBand + lexicalBand + grammarBand + pronunciationBand) / 4) * 2) / 2;
  
  return {
    fluency: fluencyBand,
    lexical: lexicalBand,
    grammar: grammarBand,
    pronunciation: pronunciationBand,
    overall: overallBand,
    metrics: metrics
  };
}

function generateDetailedFeedback(bands, metrics, grammarErrors, pronunciationAnalysis = null) {
  const fluencyDesc = DESCRIPTORS.fluency_coherence[Math.floor(bands.fluency).toString()] || ["Developing fluency skills"];
  const lexicalDesc = DESCRIPTORS.lexical_resource[Math.floor(bands.lexical).toString()] || ["Expanding vocabulary range"];
  const grammarDesc = DESCRIPTORS.grammatical_range[Math.floor(bands.grammar).toString()] || ["Improving grammatical accuracy"];
  const pronunciationDesc = DESCRIPTORS.pronunciation[Math.floor(bands.pronunciation).toString()] || ["Developing pronunciation skills"];
  
  let feedback = `**IELTS Speaking Assessment Results**\n\n`;
  feedback += `**Overall Band Score: ${bands.overall}**\n\n`;
  
  feedback += `**Fluency and Coherence - Band ${bands.fluency}:**\n`;
  feedback += `${fluencyDesc.map(desc => `• ${desc}`).join('\n')}\n\n`;
  
  feedback += `**Lexical Resource - Band ${bands.lexical}:**\n`;
  feedback += `${lexicalDesc.map(desc => `• ${desc}`).join('\n')}\n\n`;
  
  feedback += `**Grammatical Range and Accuracy - Band ${bands.grammar}:**\n`;
  feedback += `${grammarDesc.map(desc => `• ${desc}`).join('\n')}\n\n`;
  
  feedback += `**Pronunciation - Band ${bands.pronunciation}:**\n`;
  feedback += `${pronunciationDesc.map(desc => `• ${desc}`).join('\n')}\n\n`;
  
  // Enhanced detailed analysis
  feedback += `**Detailed Performance Analysis:**\n`;
  feedback += `• Response length: ${metrics.wordCount} words (${getWordCountFeedback(metrics.wordCount)})\n`;
  feedback += `• Vocabulary diversity: ${(metrics.typeTokenRatio * 100).toFixed(1)}% (${getVocabDiversityFeedback(metrics.typeTokenRatio)})\n`;
  feedback += `• Average sentence length: ${metrics.avgWordsPerSentence.toFixed(1)} words (${getSentenceLengthFeedback(metrics.avgWordsPerSentence)})\n`;
  feedback += `• Grammar errors: ${grammarErrors.length} (${getErrorRateFeedback(grammarErrors.length, metrics.wordCount)})\n`;
  
  // Fluency analysis
  if (metrics.pauseMarkers > 0 || metrics.repetitionMarkers > 0 || metrics.selfCorrectionMarkers > 0) {
    feedback += `• Fluency markers: ${metrics.pauseMarkers} hesitations, ${metrics.repetitionMarkers} repetitions, ${metrics.selfCorrectionMarkers} self-corrections\n`;
  }
  
  // Pronunciation analysis if available
  if (pronunciationAnalysis) {
    feedback += `\n**Advanced Pronunciation Analysis:**\n`;
    feedback += `• Stress pattern accuracy: ${(pronunciationAnalysis.stressAccuracy * 100).toFixed(1)}% (${getStressAccuracyFeedback(pronunciationAnalysis.stressAccuracy)})\n`;
    feedback += `• Intonation naturalness: ${(pronunciationAnalysis.intonationNaturalness * 100).toFixed(1)}% (${getIntonationFeedback(pronunciationAnalysis.intonationNaturalness)})\n`;
    feedback += `• Rhythm and timing: ${(pronunciationAnalysis.rhythmFluency * 100).toFixed(1)}% (${getRhythmFeedback(pronunciationAnalysis.rhythmFluency)})\n`;
    feedback += `• Speech clarity: ${(pronunciationAnalysis.pronunciationClarity * 100).toFixed(1)}% (${getClarityFeedback(pronunciationAnalysis.pronunciationClarity)})\n`;
  }
  
  return feedback;
}

function generateImprovementSuggestions(bands, pronunciationAnalysis = null) {
  let suggestions = `**Specific Improvement Recommendations:**\n`;
  
  // Fluency suggestions
  if (bands.fluency < 6) {
    suggestions += `**Fluency & Coherence:**\n`;
    suggestions += `• Practice speaking for 1-2 minutes without stopping\n`;
    suggestions += `• Use more linking words (however, therefore, in addition)\n`;
    suggestions += `• Reduce hesitation by preparing topic-specific vocabulary\n`;
    suggestions += `• Practice organizing ideas with clear introduction, body, and conclusion\n\n`;
  } else if (bands.fluency < 7) {
    suggestions += `**Fluency & Coherence - Next Level:**\n`;
    suggestions += `• Work on smoother transitions between ideas\n`;
    suggestions += `• Practice expressing complex ideas without hesitation\n`;
    suggestions += `• Use a wider range of discourse markers naturally\n\n`;
  }
  
  // Lexical suggestions
  if (bands.lexical < 6) {
    suggestions += `**Lexical Resource:**\n`;
    suggestions += `• Build topic-specific vocabulary (family, work, education, environment)\n`;
    suggestions += `• Learn and practice synonyms for common words\n`;
    suggestions += `• Study collocations (strong coffee, heavy rain, make a decision)\n`;
    suggestions += `• Practice paraphrasing - saying the same thing in different ways\n\n`;
  } else if (bands.lexical < 7) {
    suggestions += `**Lexical Resource - Next Level:**\n`;
    suggestions += `• Incorporate more idiomatic expressions naturally\n`;
    suggestions += `• Use less common vocabulary appropriately\n`;
    suggestions += `• Practice precise word choice for different contexts\n\n`;
  }
  
  // Grammar suggestions
  if (bands.grammar < 6) {
    suggestions += `**Grammar:**\n`;
    suggestions += `• Master all basic tenses (present, past, future, perfect)\n`;
    suggestions += `• Practice complex sentence structures with subordinate clauses\n`;
    suggestions += `• Study conditional sentences (If I were you, I would...)\n`;
    suggestions += `• Learn to use passive voice appropriately\n\n`;
  } else if (bands.grammar < 7) {
    suggestions += `**Grammar - Next Level:**\n`;
    suggestions += `• Use a wider range of complex structures naturally\n`;
    suggestions += `• Minimize errors in advanced grammar forms\n`;
    suggestions += `• Practice mixed conditionals and subjunctive mood\n\n`;
  }
  
  // Pronunciation suggestions
  if (pronunciationAnalysis) {
    if (pronunciationAnalysis.stressAccuracy < 0.6) {
      suggestions += `**Pronunciation - Stress Patterns:**\n`;
      suggestions += `• Practice word stress with multi-syllable words\n`;
      suggestions += `• Learn stress patterns for different word types (nouns vs verbs)\n`;
      suggestions += `• Use online dictionaries to check stress placement\n`;
      suggestions += `• Practice with sentence stress - emphasize important words\n\n`;
    }
    
    if (pronunciationAnalysis.intonationNaturalness < 0.6) {
      suggestions += `**Pronunciation - Intonation:**\n`;
      suggestions += `• Practice rising intonation for yes/no questions\n`;
      suggestions += `• Use falling intonation for statements and wh-questions\n`;
      suggestions += `• Vary your pitch to show emotion and emphasis\n`;
      suggestions += `• Listen to native speakers and mimic their intonation patterns\n\n`;
    }
    
    if (pronunciationAnalysis.rhythmFluency < 0.6) {
      suggestions += `**Pronunciation - Rhythm:**\n`;
      suggestions += `• Practice the natural rhythm of English (stress-timed)\n`;
      suggestions += `• Focus on clear pronunciation of stressed syllables\n`;
      suggestions += `• Reduce or blend unstressed syllables naturally\n`;
      suggestions += `• Practice with poetry or songs to improve rhythm\n\n`;
    }
  } else if (bands.pronunciation < 6) {
    suggestions += `**Pronunciation:**\n`;
    suggestions += `• Record yourself and compare with native speakers\n`;
    suggestions += `• Practice difficult sounds specific to your native language\n`;
    suggestions += `• Work on word stress and sentence rhythm\n`;
    suggestions += `• Focus on clear articulation of consonant clusters\n\n`;
  }
  
  return suggestions;
}

// Helper functions for feedback
function getWordCountFeedback(wordCount) {
  if (wordCount < 50) return "too short, aim for 100+ words";
  if (wordCount < 100) return "adequate, could be more detailed";
  if (wordCount < 200) return "good length";
  return "excellent detail";
}

function getVocabDiversityFeedback(ratio) {
  if (ratio < 0.3) return "limited variety, use more synonyms";
  if (ratio < 0.5) return "moderate variety";
  if (ratio < 0.7) return "good variety";
  return "excellent variety";
}

function getSentenceLengthFeedback(avgLength) {
  if (avgLength < 8) return "sentences too simple, add complexity";
  if (avgLength < 15) return "good balance";
  if (avgLength < 25) return "complex sentences, watch clarity";
  return "very complex, ensure clarity";
}

function getErrorRateFeedback(errors, wordCount) {
  const rate = errors / Math.max(wordCount, 1);
  if (rate < 0.02) return "very accurate";
  if (rate < 0.05) return "mostly accurate";
  if (rate < 0.1) return "some errors affect clarity";
  return "many errors impede understanding";
}

function getStressAccuracyFeedback(score) {
  if (score < 0.4) return "needs significant improvement";
  if (score < 0.6) return "developing";
  if (score < 0.8) return "good";
  return "excellent";
}

function getIntonationFeedback(score) {
  if (score < 0.4) return "too monotone, add pitch variation";
  if (score < 0.6) return "developing natural patterns";
  if (score < 0.8) return "good expressiveness";
  return "very natural and expressive";
}

function getRhythmFeedback(score) {
  if (score < 0.4) return "irregular timing, practice rhythm";
  if (score < 0.6) return "developing natural rhythm";
  if (score < 0.8) return "good timing";
  return "excellent natural rhythm";
}

function getClarityFeedback(score) {
  if (score < 0.4) return "needs clarity improvement";
  if (score < 0.6) return "generally clear";
  if (score < 0.8) return "clear and easy to understand";
  return "perfectly clear";
}

module.exports = {
  calculateBands,
  generateDetailedFeedback,
  generateImprovementSuggestions,
  calculateAdvancedMetrics,
  scoreToBand
};