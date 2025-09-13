exports.handler = async () => {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'OK',
      timestamp: new Date().toISOString(),
      version: '3.1.0 - IELTS Format',
    }),
  };
};
