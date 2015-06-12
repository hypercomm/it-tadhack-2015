function AudioSynthView() {

	var clientID;
	var eb;

	var isMobile = !!navigator.userAgent.match(/Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile/i);
	if(isMobile) { var evtListener = ['touchstart', 'touchend']; } else { var evtListener = ['mousedown', 'mouseup']; }

	var __audioSynth = new AudioSynth();
	__audioSynth.setVolume(0.5);
	var __octave = 4;
	
	// Change octave
	var fnChangeOctave = function(x) {

		x |= 0;
	
		__octave += x;
	
		__octave = Math.min(5, Math.max(3, __octave));
	
		var octaveName = document.getElementsByName('OCTAVE_LABEL');
		var i = octaveName.length;
		while(i--) {
			var val = parseInt(octaveName[i].getAttribute('value'));
			octaveName[i].innerHTML = (val + __octave);
		}
	
		document.getElementById('OCTAVE_LOWER').innerHTML = __octave-1;
		document.getElementById('OCTAVE_UPPER').innerHTML = __octave+1;
	
	};

	var midiKeyboard = {
		36:'C,-1',
		37:'C#,-1',
		38:'D,-1',
		39:'D#,-1',
		40:'E,-1',
		41:'F,-1',
		42:'F#,-1',
		43:'G,-1',
		44:'G#,-1',
		45:'A,-1',
		46:'A#,-1',
		47:'B,-1',
		
		48:'C,0',
		49:'C#,0',
		50:'D,0',
		51:'D#,0',
		52:'E,0',
		53:'F,0',
		54:'F#,0',
		55:'G,0',
		56:'G#,0',
		57:'A,0',
		58:'A#,0',
		59:'B,0',
		
		60:'C,1',
		61:'C#,1',
		62:'D,1',
		63:'D#,1',
		64:'E,1',
		65:'F,1',
		66:'F#,1',
		67:'G,1',
		68:'G#,1',
		69:'A,1',
		70:'A#,1',
		71:'B,1'
	};
	
	// Key bindings, notes to keyCodes.
	var keyboard = {
		
			/* 2 */
			50: 'C#,-1',
			
			/* 3 */
			51: 'D#,-1',
			
			/* 5 */
			53: 'F#,-1',
			
			/* 6 */
			54: 'G#,-1',
			
			/* 7 */
			55: 'A#,-1',
			
			/* 9 */
			57: 'C#,0',
			
			/* 0 */
			48: 'D#,0',
			
			/* + */
			187: 'F#,0',
			61: 'F#,0',
			
			/* Q */
			81: 'C,-1',
			
			/* W */
			87: 'D,-1',
			
			/* E */
			69: 'E,-1',
			
			/* R */
			82: 'F,-1',
			
			/* T */
			84: 'G,-1',
			
			/* Y */
			89: 'A,-1',
			
			/* U */
			85: 'B,-1',
			
			/* I */
			73: 'C,0',
			
			/* O */
			79: 'D,0',
			
			/* P */
			80: 'E,0',
			
			/* [ */
			219: 'F,0',
			
			/* ] */
			221: 'G,0',
		
			/* A */
			65: 'G#,0',
		
			/* S */
			83: 'A#,0',
			
			/* F */
			70: 'C#,1',
		
			/* G */
			71: 'D#,1',
		
			/* J */
			74: 'F#,1',
		
			/* K */
			75: 'G#,1',
		
			/* L */
			76: 'A#,1',
		
			/* Z */
			90: 'A,0',
		
			/* X */
			88: 'B,0',
		
			/* C */
			67: 'C,1',
		
			/* V */
			86: 'D,1',
		
			/* B */
			66: 'E,1',
		
			/* N */
			78: 'F,1',
		
			/* M */
			77: 'G,1',
			
			/* , */
			188: 'A,1',
			
			/* . */
			190: 'B,1'
		
		};
	
	var reverseLookupText = {};
	var reverseLookup = {};

	// Create a reverse lookup table.
	for(var i in keyboard) {
	
		var val;

		switch(i|0) {
		
			case 187:
				val = 61;
				break;
			
			case 219:
				val = 91;
				break;
			
			case 221:
				val = 93;
				break;
			
			case 188:
				val = 44;
				break;
			
			case 190:
				val = 46;
				break;
			
			default:
				val = i;
				break;
			
		}
	
		reverseLookupText[keyboard[i]] = val;
		reverseLookup[keyboard[i]] = i;
	
	}

	// Keys you have pressed down.
	var keysPressed = [];
	var visualKeyboard = null;
	var selectSound = null;

	function createUUID() {
		// http://www.ietf.org/rfc/rfc4122.txt
		var s = [];
		var hexDigits = "0123456789abcdef";
		for (var i = 0; i < 36; i++) {
			s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
		}
		s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
		s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
		s[8] = s[13] = s[18] = s[23] = "-";

		var uuid = s.join("");
		return uuid;
	}
	
	var fnCreateKeyboard = function(keyboardElement) {
		// Generate keyboard
		// This is our main keyboard element! It's populated dynamically based on what you've set above.
		var keyboardspace = document.getElementById('keyboardspace');
		
		visualKeyboard = document.getElementById('keyboard');
		selectSound = document.getElementById('sound');
		
		var menuStatus = 'stop';
		var recBtn = document.getElementById('record');
		var recIcon = document.getElementById('record_icon');
		
		var playBtn = document.getElementById('play_stop');
		var playIcon = document.getElementById('play_stop_icon');
		
		var iKeys = 0;
		var iWhite = 0;
		var notes = __audioSynth._notes;

		for(var i=-1;i<=1;i++) {
			for(var n in notes) {
				if(n[2]!='b') {
					var thisKey = document.createElement('div');
					if(n.length>1) {
						thisKey.className = 'black key';
						thisKey.style.width = '30px';
						thisKey.style.height = '120px';
						thisKey.style.left = (40 * (iWhite - 1)) + 25 + 'px';
					} else {
						thisKey.className = 'white key';
						thisKey.style.width = '40px';
						thisKey.style.height = '200px';
						thisKey.style.left = 40 * iWhite + 'px';
						iWhite++;
					}
					var label = document.createElement('div');
					label.className = 'label';
					//label.innerHTML = '<b>' + String.fromCharCode(reverseLookupText[n + ',' + i]) + '</b>' + '<br /><br />' + n.substr(0,1) +
					//	'<span name="OCTAVE_LABEL" value="' + i + '">' + (__octave + parseInt(i)) + '</span>' + (n.substr(1,1)?n.substr(1,1):'');
					label.innerHTML = '<br /><br />' + n.substr(0,1) +
						'<span name="OCTAVE_LABEL" value="' + i + '">' + (__octave + parseInt(i)) + '</span>' + (n.substr(1,1)?n.substr(1,1):'');
					thisKey.appendChild(label);
					thisKey.setAttribute('ID', 'KEY_' + n + ',' + i);
					thisKey.addEventListener(evtListener[0], (function(_temp) { return function() { fnPlayKeyboard({keyCode:_temp}); } })(reverseLookup[n + ',' + i]));
					visualKeyboard[n + ',' + i] = thisKey;
					visualKeyboard.appendChild(thisKey);
					iKeys++;
				}
			}
		}

		visualKeyboard.style.width = iWhite * 40 + 'px';

		window.addEventListener(evtListener[1], function() { n = keysPressed.length; while(n--) { fnRemoveKeyBinding({keyCode:keysPressed[n]}); } });
	
		//MIDI from other clients...
		clientID = createUUID();
		
		//var options = {protocols_whitelist: ["xhr-streaming", "xdr-streaming", "xhr-polling", "xdr-polling"], debug: true};
		eb = new vertx.EventBus('/eventbus');
		eb.onopen = function() {
			console.log('SockJS - Connection Open');

			eb.send('auth.to.server', {"open":clientID}, function(msg) {
				if(msg.id == clientID) {
					console.log('AUTH: ' + JSON.stringify(msg));
					
					//initWonder(msg.user);
					
					if(msg.type == 'music') {
						keyboardspace.style.display = 'block';
					}
					
					if(msg.type == 'client') {
						//APP.UI.setInitialMuteFromFocus(true, true);
						APP.UI.setAudioMuted(true);
						APP.UI.setVideoMute(true);
					}
				}
			});
			
			eb.registerHandler('midi.to.client', function(msg) {
				if(msg.id != clientID) {
					console.log('VERTX PLAY: ' + JSON.stringify(msg));
					if(msg.event == 'DOWN') {
						fnPlayKey(msg.key, '#ff0000');
					}
				
					if(msg.event == 'UP') {
						fnRemoveKey(msg.key);
					}
				}
			});
			
			//controls...
			recBtn.addEventListener('click', function() {
				if(menuStatus == 'stop') {
					menuStatus = 'record';
					playIcon.src = 'images/icons/stop.svg';
					recBtn.style.backgroundColor = '#ff0000'; 
					
					eb.send('midi.to.server', {"id":clientID, "event":'RECORD'});
					console.log('record');
				}
			});
		
			playBtn.addEventListener('click', function() {
				if(menuStatus == 'stop') {
					menuStatus = 'play';
					playIcon.src = 'images/icons/stop.svg';
					playBtn.style.backgroundColor = '#00ff00';
					
					eb.send('midi.to.server', {"id":clientID, "event":'PLAY'});
					console.log('play');
				} else {
					menuStatus = 'stop';
					playIcon.src = 'images/icons/play.svg';
					
					recBtn.style.backgroundColor = '#ffffff';
					playBtn.style.backgroundColor = '#ffffff';
					
					eb.send('midi.to.server', {"id":clientID, "event":'STOP'});
					console.log('stop');
				}
				
			});
		};
	
		eb.onclose = function() {
			console.log('SockJS - Connection Closed');
			eb = null;
		};
	
		//Local MIDI...
		function onMIDIMessage(event) {
			if(event.data[0] == 144) {	
				fnPlayMIDIKeyboard(event.data[1]);
			}
			
			if(event.data[0] == 128) {
				fnRemoveMIDIKeyBinding(event.data[1]);
			}
		}
	
		function onMIDISuccess(midi) {
			console.log( "MIDI ready................................................................................." );
			
			midi.inputs.forEach(function(entry) {
				console.log(entry);
				entry.onmidimessage = onMIDIMessage;
			});
		}

		function onMIDIFailure(msg) {
			console.log("Failed to get MIDI access - " + msg);
		}
		
		navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
	};

	// Creates our audio player
	var fnPlayNote = function(note, octave) {

		src = __audioSynth.generate(selectSound.value, note, octave, 2);
		container = new Audio(src);
		container.addEventListener('ended', function() { container = null; });
		container.addEventListener('loadeddata', function(e) { e.target.play(); });
		container.autoplay = false;
		container.setAttribute('type', 'audio/wav');
		/*document.body.appendChild(container);*/
		container.load();
		return container;
	
	};

	var fnPlayMIDIKeyboard = function(midiKey) {
		if(midiKeyboard[midiKey]) {
			var key = midiKeyboard[midiKey];
			eb.send('midi.to.server', {"id":clientID, "key":key, "event":'DOWN'});			
			fnPlayKey(key, '#00ff00');
		}
	};
	
	var fnRemoveMIDIKeyBinding = function(midiKey) {
		if(midiKeyboard[midiKey]) {
			var key = midiKeyboard[midiKey];
			eb.send('midi.to.server', {"id":clientID, "key":key, "event":'UP'});
			fnRemoveKey(key);
		}
	}
	
	// Detect keypresses, play notes.
	var fnPlayKeyboard = function(e) {
		var i = keysPressed.length;
		while(i--) {
			if(keysPressed[i]==e.keyCode) {
				return false;	
			}
		}
		keysPressed.push(e.keyCode);
	
		switch(e.keyCode) {
		
			// left
			case 37:
				fnChangeOctave(-1);
				break;
		
			// right
			case 39:
				fnChangeOctave(1);
				break;
		}
	
		if(keyboard[e.keyCode]) {
			var key = keyboard[e.keyCode];
			eb.send('midi.to.server', {"id":clientID, "key":key, "event":'DOWN'});
			
			//codecChat.sentMessageData({"id":clientID, "key":key, "event":'DOWN'});
			
			fnPlayKey(key, '#00ff00');
		} else {
			return false;
		}
	
	}

	// Remove key bindings once note is done.

	var fnRemoveKeyBinding = function(e) {
		var i = keysPressed.length;
		while(i--) {
			if(keysPressed[i]==e.keyCode) {
				var key = keyboard[e.keyCode];
				eb.send('midi.to.server', {"id":clientID, "key":key, "event":'UP'});
				fnRemoveKey(key);
				keysPressed.splice(i, 1);
			}
		}
	
	}

	var fnPlayKey = function(key, color) {
		console.log('DOWN ' + key);
		
		if(visualKeyboard[key]) {
			visualKeyboard[key].style.backgroundColor = color;
			visualKeyboard[key].style.marginTop = '5px';
			visualKeyboard[key].style.boxShadow = 'none';
		}
		
		var arrPlayNote = key.split(',');
		var note = arrPlayNote[0];
		var octaveModifier = arrPlayNote[1]|0;
		fnPlayNote(note, __octave + octaveModifier);
	}
	
	var fnRemoveKey = function(key) {
		console.log('UP ' + key);
	
		if(visualKeyboard[key]) {
			visualKeyboard[key].style.backgroundColor = '';
			visualKeyboard[key].style.marginTop = '';
			visualKeyboard[key].style.boxShadow = '';
		}
	}

	// Set up global event listeners
	document.getElementById('-_OCTAVE').addEventListener('click', function() { fnChangeOctave(-1); });
	document.getElementById('+_OCTAVE').addEventListener('click', function() { fnChangeOctave(1); });
	
	Object.defineProperty(this, 'draw', {
		value: fnCreateKeyboard
	});

}