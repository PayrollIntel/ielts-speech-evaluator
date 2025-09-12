exports.handler = async () => ({
  statusCode: 200,
  body: JSON.stringify({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '3.1.0 - IELTS Format',
  }),
});
