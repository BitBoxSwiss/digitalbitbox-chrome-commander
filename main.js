chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create(
      "control-panel.html",
      {
        innerBounds: { width: 840, height: 440, minWidth: 840 }
      });
});

