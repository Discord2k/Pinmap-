import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './AppModular.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById("root")).render(<App />);

if("serviceWorker" in navigator){
  window.addEventListener("load",function(){
    navigator.serviceWorker.register("./sw.js").then(function(reg){
      // If there is already a waiting worker, prompt immediately
      if (reg.waiting && navigator.serviceWorker.controller) {
        window._swUpdateReady = true;
        if(window._setUpdateReady) window._setUpdateReady(true);
      }

      // Check for updates every time the page loads
      reg.addEventListener("updatefound",function(){
        var newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener("statechange",function(){
          if(newWorker.state === "installed" && navigator.serviceWorker.controller){
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

  // Reload the page when the new service worker takes control
  var refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", function() {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}
