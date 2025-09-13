const axios = require('axios');

// Helper functions (copied from your server.js)
async function grammarCheck(text) {
  try {
    const response = await axios({
      method: 'POST',
      url: 'https://api.languagetool.org/v2/check',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      data: new URLSearchParams({
        text,
        language: 'en-US',
        enabledRules: 'GRAMMAR,TYPOS,STYLE',
        disabledRules: 'UPPERCASE_SENTENCE_START,WHITESPACE_RULE,SENTENCE_WHITESPACE',
      }).toString(),
      timeout: 10000,
    });

    const matches = response.data.matches.filter(
      m => !['UPPERCASE_SENTENCE_START', 'WHITESPACE_RULE', 'SENTENCE_WHITESPACE'].includes(m.rule.id)
    );

    return { matches, success: true };
  } catch (err) {
    console.error('Grammar check error:', err.message);
    return { matches: [], success: false, error: err.message };
  }
}

function calculateIELTSBands(grammarMatches, text, audioFeatures, questionPart) {
  // Simplified band calculation
  const wordCount = text.split(' ').length;
  let fluency = 7;
  let lexical = 6.5;
  let grammar = 7;
  let pronunciation = 6.5;

  // Adjust for grammar errors
  if (grammarMatches.length > 0) {
    grammar = Math.max(grammar - (grammarMatches.length * 0.5), 4);
  }

  // Adjust for word count based on part
  if (questionPart === 1) {
    if (wordCount < 15) fluency = Math.max(fluency - 0.5, 1);
    else if (wordCount > 100) fluency = Math.max(fluency - 0.25, 1);
  } else if (questionPart === 2) {
    if (wordCount < 100) {
      fluency = Math.max(fluency - 1, 1);
    } else if (wordCount > 300) {
      fluency = Math.min(fluency + 0.25, 9);
    }
  }

  const overall = Math.round(((fluency + lexical + grammar + pronunciation) / 4) * 2) / 2;

  return {
    fluency,
    lexical,
    grammar,
    pronunciation,
    overall,
    metrics: { wordCount }
  };
}

function generateIELTSFeedback(bands, metrics, grammarMatches, audioFeatures, questionPart, questionIndex) {
  let feedback = '';

  if (questionPart === 1) {
    feedback += `**Part 1 - Question ${questionIndex + 1}** 📝\n\n`;
  } else if (questionPart === 2) {
    feedback += `**Part 2 - Cue Card** 🎯\n\n`;
  } else if (questionPart === 3) {
    feedback += `**Part 3 - Discussion Question ${questionIndex + 1}** 💭\n\n`;
  }

  feedback += `**Band Scores:**\n`;
  feedback += `• Fluency & Coherence: ${bands.fluency}/9\n`;
  feedback += `• Lexical Resource: ${bands.lexical}/9\n`;
  feedback += `• Grammar Range & Accuracy: ${bands.grammar}/9\n`;
  feedback += `• Pronunciation: ${bands.pronunciation}/9\n`;
  feedback += `• **Overall: ${bands.overall}/9**\n\n`;

  const strengths = [];
  const improvements = [];

  if (bands.fluency >= 7) {
    strengths.push("Good fluency and natural flow of speech");
  } else {
    improvements.push("Work on speaking more fluently with fewer pauses");
  }

  if (grammarMatches.length === 0) {
    strengths.push("No major grammar errors detected");
  } else {
    improvements.push(`Grammar needs attention: ${grammarMatches.length} errors found`);
  }

  if (strengths.length > 0) {
    feedback += `**Strengths:** ✅\n`;
    strengths.forEach(strength => feedback += `• ${strength}\n`);
    feedback += '\n';
  }

  if (improvements.length > 0) {
    feedback += `**Areas for Improvement:** 📈\n`;
    improvements.forEach(improvement => feedback += `• ${improvement}\n`);
    feedback += '\n';
  }

  if (grammarMatches.length > 0) {
    feedback += `**Grammar Issues:** ⚠️\n`;
    grammarMatches.slice(0, 3).forEach(match => {
      feedback += `• ${match.message}\n`;
    });
    if (grammarMatches.length > 3) {
      feedback += `• ... and ${grammarMatches.length - 3} more issues\n`;
    }
    feedback += '\n';
  }

  return feedback;
}

function determineQuestionPart(questionIndex, totalQuestions) {
  if (questionIndex < 12) return 1;
  if (questionIndex === 12) return 2;
  return 3;
}

async function getRelevanceScore(prompt, answer) {
  if (!prompt || !answer) return 0;
  
  // Simple word overlap calculation
  const promptWords = prompt.toLowerCase().split(/\s+/);
  const answerWords = answer.toLowerCase().split(/\s+/);
  
  let matches = 0;
  const answerSet = new Set(answerWords);
  promptWords.forEach(word => {
    if (answerSet.has(word)) matches++;
  });
  
  return matches / Math.max(promptWords.length, answerWords.length);
}

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { testId, questions, answers, audioFeatures, testType } = JSON.parse(event.body);

    if (!Array.isArray(questions) || !Array.isArray(answers) || questions.length !== answers.length) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid request format' })
      };
    }

    const feedbacks = [];
    let totalFluency = 0, totalLex = 0, totalGram = 0, totalPron = 0, totalRelevance = 0, count = 0;
    const partScores = { part1: [], part2: [], part3: [] };

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const text = answers[i] || '';
      const features = audioFeatures?.[i];

      if (!text.trim()) {
        feedbacks.push({
          feedback: `**Question ${i + 1}: "${question}"**\n\nNo response provided.`,
          overall: 0,
        });
        continue;
      }

      const questionPart = determineQuestionPart(i, questions.length);
      const grammarResult = await grammarCheck(text);
      let bands = calculateIELTSBands(grammarResult.matches, text, features, questionPart);
      const relevance = await getRelevanceScore(question, text);

      if (relevance < 0.5) {
        bands.overall = Math.max(bands.overall - 0.5, 1);
      }

      let fb = `**Question ${i + 1}: "${question}"**\n\n`;
      fb += generateIELTSFeedback(bands, bands.metrics, grammarResult.matches, features, questionPart, i);
      
      if (relevance < 0.5) {
        fb += `\n\n⚠️ Relevance Warning: Off-topic (score ${relevance.toFixed(2)})`;
      }

      feedbacks.push({ feedback: fb, overall: bands.overall });

      partScores[`part${questionPart}`].push({
        fluency: bands.fluency,
        lexical: bands.lexical,
        grammar: bands.grammar,
        pronunciation: bands.pronunciation,
        overall: bands.overall
      });

      totalFluency += bands.fluency;
      totalLex += bands.lexical;
      totalGram += bands.grammar;
      totalPron += bands.pronunciation;
      totalRelevance += relevance;
      count++;
    }

    const summary = count ? {
      fluency: Math.round((totalFluency / count) * 2) / 2,
      lexical: Math.round((totalLex / count) * 2) / 2,
      grammar: Math.round((totalGram / count) * 2) / 2,
      pronunciation: Math.round((totalPron / count) * 2) / 2,
      overall: Math.round(((totalFluency + totalLex + totalGram + totalPron) / (count * 4)) * 2) / 2,
      avgRelevance: totalRelevance / count,
      partBreakdown: {
        part1Average: partScores.part1.length > 0 ?
          partScores.part1.reduce((sum, score) => sum + score.overall, 0) / partScores.part1.length : 0,
        part2Score: partScores.part2.length > 0 ? partScores.part2[0].overall : 0,
        part3Average: partScores.part3.length > 0 ?
          partScores.part3.reduce((sum, score) => sum + score.overall, 0) / partScores.part3.length : 0
      }
    } : null;

    if (summary) {
      let summaryFeedback = '\n\n**IELTS Speaking Test Summary** 🎯\n\n';
      summaryFeedback += `**Overall Band Score: ${summary.overall}/9**\n\n`;
      summaryFeedback += `**Performance by Part:**\n`;
      summaryFeedback += `• Part 1 (Introduction): ${summary.partBreakdown.part1Average.toFixed(1)}/9\n`;
      summaryFeedback += `• Part 2 (Cue Card): ${summary.partBreakdown.part2Score.toFixed(1)}/9\n`;
      summaryFeedback += `• Part 3 (Discussion): ${summary.partBreakdown.part3Average.toFixed(1)}/9\n\n`;

      feedbacks.unshift({ feedback: summaryFeedback, overall: summary.overall });
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ testId, feedbacks, testSummary: summary })
    };

  } catch (err) {
    console.error('Batch analysis error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Batch analysis error', details: err.message })
    };
  }
};
