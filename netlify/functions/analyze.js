const axios = require('axios');

// Copy the same helper functions from analyze-batch.js (grammarCheck, calculateIELTSBands, etc.)
// ... (same helper functions as above)

exports.handler = async (event, context) => {
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
    const { text, audioFeatures, prompt, questionPart, questionIndex } = JSON.parse(event.body);

    if (!text || !text.trim()) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No text provided' })
      };
    }

    const grammarResult = await grammarCheck(text);
    let bands = calculateIELTSBands(grammarResult.matches, text, audioFeatures, questionPart);
    const relevance = await getRelevanceScore(prompt || '', text);

    if (relevance < 0.5) {
      bands.overall = Math.max(bands.overall - 0.5, 1);
    }

    const feedback = generateIELTSFeedback(
      bands,
      bands.metrics,
      grammarResult.matches,
      audioFeatures,
      questionPart,
      questionIndex || 0
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        feedback,
        fluency: bands.fluency,
        lexical: bands.lexical,
        grammar: bands.grammar,
        pronunciation: bands.pronunciation,
        overall: bands.overall,
        relevanceScore: relevance,
        grammarErrors: grammarResult.matches.length,
      })
    };

  } catch (err) {
    console.error('Analysis error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Analysis error occurred', details: err.message })
    };
  }
};
