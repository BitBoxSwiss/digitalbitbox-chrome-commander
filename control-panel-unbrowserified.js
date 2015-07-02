(function() {
  
 
  var Crypto = require("crypto");
  var Bitcore = require.main.paths("bitcore");
  //var Script = Bitcore.Script;



  var pw = '0000';
  var key = '34d86e688aa433788e29ee3cf8bba62709b8591a63763be4f5e25e9a7def96b7';

  var connection = -1;
  var deviceMap = {};
  var pendingDeviceMap = {};
  var reportBufferSize = 2048; 
  var deviceId = -1;
  var command = ''; 
  var deviceConnected = false;  
  var dialog;
  var command;
 

  
  
  var ui = {
    outData: null,
    send: null,
    inPoll: null,
    inputLog: null,
    receive: null,
    clear: null,
   
    deviceName: null,
    deviceSerial: null,
    deviceVersion: null,
    toggleLed: null,
    getRandom: null,
    setPassword: null,
    getXpub: null,
    deviceErase: null,
    deviceLock: null,
    sdList: null,
    sdErase: null,
    sdBackup: null,
    tfaCreate: null,
    tfaExport: null,
    aesCrypto: null,
    
    walletSign: null,
    walletSeed: null,
    
    dialogCancel: null,
    dialogAccept: null,
    dialogValue: null,
    dialogText: null,
    dialogTextarea: null,
   
    dialogSeeddecrypt: null,
    
    dialogBackupunencrypt: null,
    dialogBackupencrypt: null,
    dialogAesencrypt: null,
    dialogAesdecrypt: null,
    dialogAeskey: null,

  };

  var initializeWindow = function() {
    for (var k in ui) {
      var id = k.replace(/([A-Z])/, '-$1').toLowerCase();
      var element = document.getElementById(id);
      if (!element) {
        throw "Missing UI element: " + k;
      }
      ui[k] = element;
    }
    enableIOControls(false);
    
    ui.deviceName.addEventListener('click', onDeviceNameClicked);
    ui.deviceSerial.addEventListener('click', onDeviceSerialClicked);
    ui.deviceVersion.addEventListener('click', onDeviceVersionClicked);
    ui.toggleLed.addEventListener('click', onToggleLedClicked);
    ui.getRandom.addEventListener('click', onGetRandomClicked);
    ui.setPassword.addEventListener('click', onSetPasswordClicked);
    ui.getXpub.addEventListener('click', onGetXpubClicked);
    ui.deviceErase.addEventListener('click', onDeviceEraseClicked);
    ui.deviceLock.addEventListener('click', onDeviceLockClicked);
    ui.sdList.addEventListener('click', onSdListClicked);
    ui.sdErase.addEventListener('click', onSdEraseClicked);
    ui.sdBackup.addEventListener('click', onSdBackupClicked);
    ui.tfaCreate.addEventListener('click', onTfaCreateClicked);
    ui.tfaExport.addEventListener('click', onTfaExportClicked);
    ui.aesCrypto.addEventListener('click', onAesCryptoClicked);
    ui.walletSign.addEventListener('click', onWalletSignClicked);
    ui.walletSeed.addEventListener('click', onWalletSeedClicked);
    
    ui.inPoll.addEventListener('change', onPollToggled);
    ui.receive.addEventListener('click', onReceiveClicked);
    ui.clear.addEventListener('click', onClearClicked);
    enumerateDevices();
 

	dialog = document.querySelector('#dialogOne');
    ui.dialogCancel.addEventListener("click", function(evt) {
      dialog.close();
	});
	ui.dialogAccept.addEventListener("click", function(evt) {
      dialogClosed();
      dialog.close();
	});
	
    dialog.addEventListener("close", function(evt) {
	    ui.dialogTextarea.value = "";
	    ui.dialogValue.value = "";
	});
	// called when the user Cancels the dialog, for example by hitting the ESC key
	dialog.addEventListener("cancel", function(evt) {
		dialog.close("cancel");
	});
    
	document.querySelector('#dialogButtonsBackup').style.display = "none";
	document.querySelector('#dialogButtonsSeed').style.display = "none";
	document.querySelector('#dialogButtonsAes').style.display = "none";
	ui.dialogTextarea.style.display = "none";
	ui.dialogValue.style.display = "inline";
  
    
    document.getElementById("dialogForm").onkeypress = function() {
        console.log('keypress');
        if (ui.dialogTextarea.style.display === "none" && event.which == 13) {
            dialogClosed();
            dialog.close();
            return false;
        }
    };
    //});
    
    document.getElementById("dialogForm").onsubmit = function() {
        console.log('form submit');
        return false;
    };
    
    
    //document.querySelector('#dialogForm').addEventListener('submit', function (evt) {return false;});
  };

  var dialogClosed = function() {
	  var val = ui.dialogValue.value + ui.dialogTextarea.value;
      //console.log(command);
      //console.log(command === "backup");
      if (command === "backup") {
          //console.log(command);
          //console.log(ui.dialogBackupunencrypt.checked);
          //console.log(ui.dialogBackupencrypt.checked);
          if (ui.dialogBackupunencrypt.checked) {
              val = '{"filename":"' + val + '", "encrypt":"no"}';
              makeCommand(command, val); 
          } else if (ui.dialogBackupencrypt.checked) {
              val = '{"filename":"' + val + '", "encrypt":"yes"}';
              makeCommand(command, val); 
          }
      }
      else if (command === "seed") {
          if (ui.dialogSeeddecrypt.checked) {
              val = '{"source":"' + val + '", "decrypt":"yes"}';
              makeCommand(command, val); 
          } else {
              val = '{"source":"' + val + '"}';
              makeCommand(command, val); 
          }
      }
      else if (command === "aes256cbc") {
          //console.log(command);
          //console.log(ui.dialogAeskey.checked);
          //console.log(ui.dialogAesdecrypt.checked);
          //console.log(ui.dialogAesencrypt.checked);
          if (ui.dialogAeskey.checked) {
              val = '{"data":"' + val + '", "type":"password"}';
              makeCommand(command, val); 
          } else if (ui.dialogAesdecrypt.checked) {
              val = '{"data":"' + val + '", "type":"decrypt"}';
              makeCommand(command, val); 
          } else if (ui.dialogAesencrypt.checked) {
              val = '{"data":"' + val + '", "type":"encrypt"}';
              makeCommand(command, val); 
          }
      }
      else {
          makeCommand(undefined, '"' + val + '"'); 
      }
      command = "";
  };

  var dialogSimple = function(text) {
	  document.querySelector('#dialogButtonsBackup').style.display = "none";
	  document.querySelector('#dialogButtonsSeed').style.display = "none";
	  document.querySelector('#dialogButtonsAes').style.display = "none";
	  ui.dialogTextarea.style.display = "none";
	  ui.dialogValue.style.display = "inline";
	  ui.dialogValue.focus();
	  ui.dialogText.textContent = text;
      dialog.showModal();
  };

  var dialogBackup = function() {
	  document.querySelector('#dialogButtonsBackup').style.display = "inline";
	  document.querySelector('#dialogButtonsSeed').style.display = "none";
	  document.querySelector('#dialogButtonsAes').style.display = "none";
	  ui.dialogTextarea.style.display = "none";
	  ui.dialogValue.style.display = "inline";
	  ui.dialogValue.focus();
      command = "backup";
      ui.dialogText.textContent = "Enter a file name";
      dialog.showModal();
  };
  
  var dialogSeed = function() {
	  document.querySelector('#dialogButtonsBackup').style.display = "none";
	  document.querySelector('#dialogButtonsSeed').style.display = "inline";
	  document.querySelector('#dialogButtonsAes').style.display = "none";
	  ui.dialogValue.style.display = "none";
	  ui.dialogTextarea.style.display = "inline";
	  ui.dialogTextarea.focus();
      command = "seed";
      ui.dialogText.textContent = "Generate a new wallet by entering either (i) the word 'create', (ii) a 24-word BIP39 mnemonic seed, or (iii) the name of a file on the micro SD card.";
      dialog.showModal();
  };

  var dialogAes = function() {
	  document.querySelector('#dialogButtonsBackup').style.display = "none";
	  document.querySelector('#dialogButtonsSeed').style.display = "none";
	  document.querySelector('#dialogButtonsAes').style.display = "inline";
	  ui.dialogValue.style.display = "none";
	  ui.dialogTextarea.style.display = "inline";
	  ui.dialogTextarea.focus();
      command = "aes256cbc";
      ui.dialogText.textContent = "Enter a new secret key, or enter text to encrypt or decrypt";
      dialog.showModal();
  };


  var dialogSign = function() {
	  document.querySelector('#dialogButtonsBackup').style.display = "none";
	  document.querySelector('#dialogButtonsSeed').style.display = "none";
	  document.querySelector('#dialogButtonsAes').style.display = "none";
	  ui.dialogValue.style.display = "inline";
	  ui.dialogTextarea.style.display = "none";
	  ui.dialogTextarea.focus();
      command = "sign";
      ui.dialogText.textContent = "Sign";
      dialog.showModal();
  };


  var makeCommand = function(cmd, val) {
      if (cmd)
          command = cmd;
      var c = '{"' + command + '":' + val + '}';
      console.log(c);
      sendCommand(c);
  };


  var enableIOControls = function(ioEnabled) {
    //ui.deviceSelector.disabled = ioEnabled;
    //ui.connect.style.display = ioEnabled ? 'none' : 'inline';
    //ui.disconnect.style.display = ioEnabled ? 'inline' : 'none';
    ui.inPoll.disabled = !ioEnabled;
    ui.send.disabled = !ioEnabled;
    ui.receive.disabled = !ioEnabled;
    deviceConnected = ioEnabled;
  };






  var onDeviceSerialClicked = function() { makeCommand("device",'"serial"'); };
  var onDeviceVersionClicked = function() { makeCommand("device",'"version"'); };
  var onToggleLedClicked = function() { makeCommand("led",'"toggle"'); };
  var onGetRandomClicked = function() { makeCommand("random",'"pseudo"'); };
  var onDeviceLockClicked = function() { makeCommand("device",'"lock"'); };
  var onDeviceEraseClicked = function() { makeCommand("reset",'"__ERASE__"'); };
  var onSdListClicked = function() { makeCommand("backup",'"list"'); };
  var onSdEraseClicked = function() { makeCommand("backup",'"erase"'); };
  var onTfaCreateClicked = function() { makeCommand("verifypass",'"create"'); };
  var onTfaExportClicked = function() { makeCommand("verifypass",'"export"'); };
  var onSendClicked = function() { sendCommand(ui.outData.value); }; 
  
  
  var onSdBackupClicked = function() { dialogBackup(); };
  var onAesCryptoClicked = function() { dialogAes(); };
  var onWalletSignClicked = function() { dialogSign(); };
  var onWalletSeedClicked = function() { dialogSeed(); };
      
  var onDeviceNameClicked = function() {
      command = "name";
      dialogSimple("Enter a new name, or leave empty to read the current name");
  };

  var onSetPasswordClicked = function() {
      command = "password";
      dialogSimple("Enter a password");
  };

  var onGetXpubClicked = function() {
      command = "xpub";
      dialogSimple("Enter a keypath");
  };


  var sendCommand = function(contents) {
    if (!deviceConnected) 
        return;
    //var id = +ui.outId.value;
    //var bytes = new Uint8Array(+ui.outSize.value);
    var bytes = new Uint8Array(reportBufferSize);
    //var contents = ui.outData.value;
    
    //console.log(contents);
    if (contents.search('"password":') < 0 ) {
        contents = aes_cbc_b64_encrypt(contents);
    }
    //console.log(contents);
    contents = contents.replace(/\\x([a-fA-F0-9]{2})/g, function(match, capture) {
      return String.fromCharCode(parseInt(capture, 16));
    });
    //console.log(contents);
    
    
    for (var i = 0; i < contents.length && i < bytes.length; ++i) {
      if (contents.charCodeAt(i) > 255) {
        throw "I am not smart enough to decode non-ASCII data.";
      }
      bytes[i] = contents.charCodeAt(i);
    }
    //var pad = +ui.outPad.value;
    for (var i = contents.length; i < bytes.length; ++i) {
      //bytes[i] = pad;
      bytes[i] = 0;
    }
    ui.send.disabled = true;
  
    //chrome.hid.send(connection, id, bytes.buffer, function() {
    chrome.hid.send(connection, 0, bytes.buffer, function() {
      ui.send.disabled = false;
    });
  };



  
  
  
  

  //var pendingDeviceEnumerations;
  var enumerateDevices = function() {
    //console.log('enumerate');
    var deviceIds = [];
    var permissions = chrome.runtime.getManifest().permissions;
    for (var i = 0; i < permissions.length; ++i) {
      var p = permissions[i];
      if (p.hasOwnProperty('usbDevices')) {
        deviceIds = deviceIds.concat(p.usbDevices);
      }
    }
    //pendingDeviceEnumerations = 0;
    pendingDeviceMap = {};
    for (var i = 0; i < deviceIds.length; ++i) {
      //++pendingDeviceEnumerations;
      chrome.hid.getDevices(deviceIds[i], onDevicesEnumerated);
    }
  };

  var onDevicesEnumerated = function(devices) {
    // Connect
    if (devices.length && !deviceConnected) {
        //console.log('connect');
        deviceId = devices[0].deviceId;
        chrome.hid.connect(deviceId, function(connectInfo) {
        if (!connectInfo) {
            console.warn("Unable to connect to device.");
        }
        //console.log(connectInfo.connectionId);
        connection = connectInfo.connectionId;
        enableIOControls(true);
        isReceivePending = false;
        enablePolling(ui.inPoll.checked);
        });
    } else if (!devices.length && deviceConnected){
        //chrome.hid.disconnect(deviceId, function() {});
        deviceId = -1;
        enableIOControls(false);
    }
      
    setTimeout(enumerateDevices, 1000);
  };


  var isReceivePending = false;
  var pollForInput = function() {
    //var size = +ui.inSize.value;
    isReceivePending = true;
    chrome.hid.receive(connection, function(reportId, data) {
      isReceivePending = false;
      logInput(new Uint8Array(data));
      if (ui.inPoll.checked) {
        setTimeout(pollForInput, 0);
      }
    });
  };

  var enablePolling = function(pollEnabled) {
    ui.inPoll.checked = pollEnabled;
    if (pollEnabled && !isReceivePending) {
      pollForInput();
    }
  };

  var onPollToggled = function() {
    enablePolling(ui.inPoll.checked);
  };

  var onReceiveClicked = function() {
    enablePolling(false);
    if (!isReceivePending) {
      pollForInput();
    }
  };

  var byteToHex = function(value) {
    if (value < 16)
      return '0' + value.toString(16);
    return value.toString(16);
  };

  var logInput = function(bytes) {
    var log = '';
    for (var i = 0; i < bytes.length; i += 16) {
      var sliceLength = Math.min(bytes.length - i, 16);
      var lineBytes = new Uint8Array(bytes.buffer, i, sliceLength);
      for (var j = 0; j < lineBytes.length; ++j) {
        var ch = String.fromCharCode(lineBytes[j]);
        if (lineBytes[j] < 32 || lineBytes[j] > 126) {
           continue;  
           //ch = '.';
        }
        log += ch;
      }
    }
    //console.log(log);
    log = hidParseReport(log);
    //console.log(log);
    log += "\n";
    ui.inputLog.textContent += log;
    ui.inputLog.scrollTop = ui.inputLog.scrollHeight;
  };

  var onClearClicked = function() {
    ui.inputLog.textContent = "";
  };









  var hidParseReport = function(report) 
  {
    var r;
    //console.log(report);
    try {
        r = JSON.parse(report);
        //console.log(r);
        if (r.ciphertext) 
            r = aes_cbc_b64_decrypt(r.ciphertext);
        else
            r = JSON.stringify(r, undefined, 4);
    }
    catch(err) {
        r = report;
    }
    return r;
  };



  var prettyprint = function(res)
  {
    // if JSON string, pretty print result
    var pprnt;
    var s;
    try {
        pprnt = JSON.parse(res);
        pprnt = JSON.stringify(pprnt, undefined, 4);
    }
    catch(err) {
        console.log(err);
        pprnt = res;
    }
    return pprnt;
  };


  var aes_cbc_b64_decrypt = function(ciphertext)
  {
    var res;
    try {
        var ub64 = new Buffer(ciphertext, "base64").toString("binary");
        var iv   = new Buffer(ub64.slice(0, 16), "binary");
        var enc  = new Buffer(ub64.slice(16), "binary");
        var k    = new Buffer(key, "hex");
        var decipher = Crypto.createDecipheriv("aes-256-cbc", k, iv);
        var dec = decipher.update(enc) + decipher.final();
        res = dec.toString("utf8");
    }
    catch(err) {
        console.log(err);
        res = ciphertext;
        //return err.message;
    }
    
    return res;
  };


  var aes_cbc_b64_encrypt = function(plaintext)
  {
    try {
        var iv = Crypto.pseudoRandomBytes(16);
        var k  = new Buffer(key, "hex");
        var cipher = Crypto.createCipheriv("aes-256-cbc", k, iv);
        var ciphertext = Buffer.concat([iv, cipher.update(plaintext), cipher.final()]);
        return ciphertext.toString("base64");
    }
    catch(err) {
        console.log(err);
        //return err.message;
    }
  };

  window.addEventListener('load', initializeWindow);
}());


