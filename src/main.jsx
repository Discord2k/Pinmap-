import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
// Capture PWA install prompt
window.addEventListener("beforeinstallprompt",function(e){
  e.preventDefault();
  window._installPromptEvent = e;
});

if("serviceWorker" in navigator){
  window.addEventListener("load",function(){
    navigator.serviceWorker.register("./sw.js").then(function(reg){
      // Check for updates every time the page loads
      reg.addEventListener("updatefound",function(){
        var newWorker = reg.installing;
        newWorker.addEventListener("statechange",function(){
          if(newWorker.state==="installed" && navigator.serviceWorker.controller){
            // New version available - notify the app
            window._swUpdateReady = true;
            if(window._setUpdateReady) window._setUpdateReady(true);
          }
        });
      });
      // Also check for updates on focus
      window.addEventListener("focus",function(){ reg.update().catch(function(){}); });
    }).catch(function(err){ console.log('SW registration failed (non-critical):', err); });
  });
}
