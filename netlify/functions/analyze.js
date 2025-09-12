const { grammarCheck, calculateIELTSBands, generateIELTSFeedback } = require('../../utils/analysis');
const { getRelevanceScore } = require('../../relevanceChecker');

exports.handler = async (event, context) => {
  try {
    const { text, audioFeatures, prompt, questionPart, questionIndex } = JSON.parse(event.body || '{}');

    if (!text || !text.trim()) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No text provided' }) };
    }

    const grammarResult = await grammarCheck(text);
    let bands = calculateIELTSBands(grammarResult.matches, text, audioFeatures, questionPart);

    const relevance = await getRelevanceScore(prompt || '', text);
    const RELEVANCE_THRESHOLD = 0.5;
    let relevanceWarning = '';

    if (relevance < RELEVANCE_THRESHOLD) {
      relevanceWarning = `\n\n⚠️ Relevance Warning: Off-topic answer (score ${relevance.toFixed(2)}).`;
      if (relevance === 0) {
        relevanceWarning += ' Your answer is completely off-topic. Please address the question directly.';
      }
      bands.overall = Math.max(bands.overall - 0.5, 1);
    }

    const feedback = generateIELTSFeedback(
      bands,
      bands.metrics,
      grammarResult.matches,
      audioFeatures,
      questionPart,
      questionIndex || 0
    ) + relevanceWarning;

    return {
      statusCode: 200,
      body: JSON.stringify({
        feedback,
        fluency: bands.fluency,
        lexical: bands.lexical,
        grammar: bands.grammar,
        pronunciation: bands.pronunciation,
        overall: bands.overall,
        relevanceScore: relevance,
        grammarErrors: grammarResult.matches.length,
      }),
    };
  } catch (err) {
    console.error('Analysis error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Analysis error occurred', details: err.message }),
    };
  }
};

