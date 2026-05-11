$ErrorActionPreference = "Stop"
$html = Get-Content -Raw -Path "legacy_backup\index.html"
$lines = $html -split "`n"
$startLineMatch = $lines -match "function App\(\) \{"
if ($startLineMatch.Count -eq 0) { throw "Could not find start of App" }
$start = [array]::IndexOf($lines, $startLineMatch[0])

$rootLineMatch = $lines -match "ReactDOM.createRoot"
if ($rootLineMatch.Count -eq 0) { throw "Could not find root" }
$root = [array]::IndexOf($lines, $rootLineMatch[0])

$end = $root - 1
while([string]::IsNullOrWhiteSpace($lines[$end])) { $end-- }

$appBody = $lines[$start..$end] -join "`n"

$outApp = @"
import React, { useState, useEffect, useRef } from 'react';
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

$appBody

export default App;
"@

Set-Content -Path "src\App.jsx" -Value $outApp

$mainBodyRaw = $lines[$root..($lines.Length-1)] -join "`n"
$mainBody = $mainBodyRaw -replace '</script>','' -replace '</body>','' -replace '</html>',''
$mainBody = $mainBody.Trim()
$mainBody = $mainBody -replace 'React.createElement\(App\)','<App />'

$outMain = @"
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

$mainBody
"@

Set-Content -Path "src\main.jsx" -Value $outMain

Write-Output "App.jsx and main.jsx generated successfully."
