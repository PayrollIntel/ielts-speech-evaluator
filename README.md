# IELTS Speech Evaluator - Complete Setup Guide

This is a comprehensive IELTS Speaking Test evaluation application with advanced pronunciation analysis, stress pattern detection, and intonation analysis.

## Features

- **Complete IELTS Assessment**: All 4 criteria (Fluency, Vocabulary, Grammar, Pronunciation)
- **Advanced Pronunciation Analysis**: Stress patterns, intonation, rhythm detection
- **Real-time Audio Processing**: Live feedback during recording
- **Official Band Descriptors**: Based on authentic IELTS scoring criteria
- **Web-based Interface**: No installation required for users

## Prerequisites

- Node.js (version 16 or higher)
- npm (comes with Node.js)
- Modern web browser (Chrome recommended)
- Microphone access

## Environment Setup

Create environment files to configure the frontend API base URL:

- `.env.development` – used when running `npm run dev`
- `.env.production` – used for production builds

Each file should define:

```
REACT_APP_API_BASE=http://localhost:5000
```

Set `REACT_APP_API_BASE` to the backend's base URL (omit the trailing slash). For production, replace the value with your deployed backend URL.

## Installation & Setup

### 1. Initial Setup
```bash
# Navigate to project directory
cd ielts-speech-evaluator

# Install dependencies
npm install

# Start the development server
npm run dev
```

### 2. Testing Locally
```bash
# For development with auto-restart
npm run dev

# For production testing
npm start
```

The application will be available at:
- Backend API: http://localhost:5000
- Frontend: http://localhost:3000 (if using separate React server)

### 3. Deployment Ready
```bash
# Build for production
npm run build

# The build folder contains deployable static files
```

## Project Structure

```
ielts-speech-evaluator/
├── package.json                 # Dependencies and scripts
├── server.js                   # Main Express server
├── bandScorer.js              # IELTS scoring engine
├── ieltsDescriptors.json      # Official band descriptors
├── pronunciationAnalyzer.js   # Advanced speech analysis
├── public/                    # Static files
│   ├── index.html            # Main HTML file
│   └── favicon.ico
├── src/                      # React source files
│   ├── index.js             # React entry point
│   ├── App.js               # Main React component
│   ├── SpeechEvaluator.jsx  # Enhanced speech evaluator
│   └── components/          # Additional components
├── netlify.toml             # Netlify deployment config
└── README.md               # This file
```

## Usage

1. **Start the application**: `npm run dev`
2. **Open browser**: Navigate to http://localhost:3000
3. **Take a test**: Click "Start Recording" and speak clearly
4. **Get results**: Receive detailed feedback with band scores
5. **Review analysis**: See stress patterns, intonation, and improvement suggestions

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/analyze` - Basic text analysis
- `POST /api/analyze-batch` - Complete test analysis
- `POST /api/analyze-pronunciation` - Advanced pronunciation analysis

## Deployment

### Netlify
1. Push code to GitHub
2. Connect repository to Netlify
3. Deploy automatically using netlify.toml configuration

### Other Platforms
- Vercel: Use `vercel` CLI
- Heroku: Use `git push heroku main`
- AWS/Google Cloud: Follow platform-specific guides

## Troubleshooting

### Common Issues

**Microphone not working:**
- Ensure browser permissions are granted
- Use HTTPS (required for microphone access)
- Try Chrome or Edge browsers

**Build errors:**
- Run `npm install` to ensure dependencies are installed
- Check Node.js version (minimum 16.0.0)
- Clear npm cache: `npm cache clean --force`

**Server won't start:**
- Check if port 5000 is available
- Verify all files are present
- Check console for error messages

## Development

### Adding New Features
1. Modify React components in `src/`
2. Update server logic in `server.js`
3. Add new scoring criteria to `bandScorer.js`
4. Test locally before deployment

### Customization
- Modify questions in `SpeechEvaluator.jsx`
- Adjust scoring weights in `bandScorer.js`
- Update UI styles in component files

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review console errors
3. Verify microphone and browser compatibility
4. Ensure stable internet connection for grammar checking

## License

MIT License - see LICENSE file for details