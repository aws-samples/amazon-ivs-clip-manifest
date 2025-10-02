# Amazon IVS Clip Manifest - Frontend UI

React application for managing IVS recordings and creating clips with visual controls.

## 🎨 Components

### VideoPlayer (`./src/components/player/`)
- **Amazon IVS Player** integration
- **Video.js** fallback support
- Timeline scrubbing and playback controls
- Clip preview functionality

### ClipControls (`./src/components/ClipControls.js`)
- Visual timeline for clip creation
- Start/end time selection
- Duration display and validation
- Real-time preview updates

### ClipsGallery (`./src/components/ClipsGallery.js`)
- Grid view of created clips
- Thumbnail previews
- Clip metadata display
- Playback modal integration

### HomePage (`./src/components/HomePage.js`)
- Main application layout
- Recording selection
- Clip management workflow
- Debug logging integration

## 🔧 Development Setup

**Prerequisites:**
- Node.js 16+ installed
- Backend APIs deployed and configured

**Local Development:**
```bash
npm install
npm start
```

**Configuration:**
The app expects `src/config.json` with API endpoints:
```json
[
  [
    {
      "OutputKey": "ApiURLGetRecordings",
      "OutputValue": "https://api-gateway-url/getrecordings/"
    },
    {
      "OutputKey": "ApiURLGetClips", 
      "OutputValue": "https://api-gateway-url/getclips/"
    },
    {
      "OutputKey": "ApiURLCreateClip",
      "OutputValue": "https://api-gateway-url/clipmanifest/"
    }
  ]
]
```

## 📦 Dependencies

- **react** - UI framework
- **amazon-ivs-player** - Optimized IVS playback
- **video.js** - Fallback video player
- **react-router-dom** - Client-side routing

## 🚀 Deployment

Use the interactive installer from project root:
```bash
npm run deploy
```

Select option 4: "Setup Frontend UI"

For public hosting, see [Public Deploy Guide](./public-deploy/README.md)

## 🔗 Related

- [Backend APIs](../serverless/README.md)
- [Standalone API](../standalone-api/README.md)
- [Main Documentation](../README.md)
