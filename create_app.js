const fs = require('fs');

const htmlPath = '../index.html';
const lines = fs.readFileSync(htmlPath, 'utf8').split('\n');

let startIdx = lines.findIndex(l => l.includes('function App() {'));
let rootIdx = lines.findIndex(l => l.includes('ReactDOM.createRoot'));
let endIdx = rootIdx - 1;
while (lines[endIdx].trim() === '') endIdx--;

const appBody = lines.slice(startIdx, endIdx + 1).join('\n');

const outApp = `import React, { useState, useEffect, useRef } from 'react';
import { api, sb, subscribeToPush, uploadPhoto, callEdgeFunction } from './utils/api';
import { dbGetAll, dbPut, dbDelete, uid, formatLL, tagColor, getPinIcon, distKm, checkBannedTags, userName, userAvatar, dlFile, toGeoJSON, toGPX, WHATSNEW, ONBOARD_KEY, WHATSNEW_KEY, ALL_FEATURES, ONBOARD_STEPS } from './utils/helpers';
import { T, S } from './utils/styles';
import { Splash } from './components/Splash';
import { Onboarding } from './components/Onboarding';
import { Comments } from './components/Comments';
import { PinCard } from './components/PinCard';
import { ProfilePanel } from './components/ProfilePanel';
import { MineTab } from './components/MineTab';
import { WhatsNew } from './components/WhatsNew';

var e = React.createElement;

${appBody}

export default App;
`;

fs.writeFileSync('src/App.jsx', outApp);

let mainBody = lines.slice(rootIdx).join('\n')
  .replace('</script>', '')
  .replace('</body>', '')
  .replace('</html>', '')
  .trim();

// Ensure JSX is used in main.jsx
mainBody = mainBody.replace('React.createElement(App)', '<App />');

const outMain = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

${mainBody}
`;

fs.writeFileSync('src/main.jsx', outMain);

console.log("App.jsx and main.jsx generated successfully.");
