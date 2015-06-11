# Digital Bitbox command window 
A Chrome Extension generic API interface.

(early alpha)

To use:
- Clone the repository
- Browse to chrome://extensions
- Select the `Developer mode` checkbox
- Select `Load unpacked extension...`
- Choose the `digitalbitbox-chrome-commander` folder
- Find the new extension in the browser tab, and `Launch`


Currently only works with a device password set to `0000`


To hack the javascript, edit the `control-panel-unbrowserified.js` file, then `browserify control-panel-unbrowserified.js -o control-panel.js` before reloading the extension. Browserify is available from the Node.js package manager `npm` 
