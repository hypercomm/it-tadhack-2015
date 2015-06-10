
/* Some variables in the global scope to keep some states.
*/
var myIdentity;
var peerIdentity;
var initiator;
var contextId;
var codecChat;
var myRtcIdentity;
var conversation;
/* The Resource constrains to be used for the initial call establishment. 
*/ 

var STUN = {url: "stun:150.140.184.242:3478"};
var TURN = {
    url: "turn:150.140.184.242",
    username: "wonder",
    credential: "w0nd3r"
};
var iceServers = {"iceServers": [STUN, TURN]};

var constraints = [{
    constraints: "",
    type: ResourceType.CHAT,
    direction: "in_out"
}
];

onCreateSessionDescriptionError = function(){ console.log(“Error on Session description creation”)};
onSetSessionDescriptionError = function(){console.log(“Error on Session description assignment”)};
onSetSessionDescriptionSuccess = function(){console.log(“Session description success”)};


/* The initialization of the WONDER stack. 
	- This includes the creation of the own Identity as well as the download and connection of the MessagingStub.
	- This snippet mainly replaces the openChannel() method in the original code.
*/
function initWonder(music) {

	myRtcIdentity =  music;

	// bind main event listener listener 
	var listener = this.onMessage.bind(this);
	// create own Identity
    Idp.getInstance().createIdentity(myRtcIdentity, function(identity) {
	    myIdentity = identity;
	    myIdentity.resolve(function(stub) {
	        stub.addListener(listener);
	        stub.connect(myRtcIdentity, credentials, function(){
	        });
	    });
    });
}



/* This method performs all required actions to establish the communication with the user(s), represented by the entered URI(s). This includes:
	- Requesting access to local media sources (camera, microphone)
	- Resolving of the target URI(s) and downloading of the corresponding messagingStub(s)
	- Connection of the stub(s) with the target domains
	- Sending of the invitation message to the target users
	- Handling of response and establishment of the RTCPeerConnection
*/
function doCall(artists) {
	var peers = artists;
	conversation = new Conversation(myIdentity, this.onRTCEvt.bind(this),this.onMessage.bind(this), iceServers, constraints);
	var invitation = new Object();
	invitation.peers = peers;
	conversation.open(peers, "", constraints, invitation, function(){}, function(){});	
}

/*  This method is the callback for incoming Wonder messages. 
	- In this minimal example, it just handles incoming Invitations and Bye messages. 
	- On incoming invitations, a confirmation dialog is displayed with the options to accept or reject the call. 
	- The Bye handling just performs some cleanup actions. 
*/
function onMessage(message) {
	switch (message.type) {
		case MessageType.BYE:			
			conversation = null;
			break;
		case MessageType.INVITATION:
			//  Create new conversation object
			conversation = new Conversation(myIdentity, this.onRTCEvt.bind(this), this.onMessage.bind(this), iceServers, constraints, myIdentity);                           
	        conversation.acceptInvitation(message);
			break;
        case MessageType.UPDATE:
            console.log("UPDATE RECEIVED");
            // HTML5 BUG WORKAROUND
            // The HTML5 video tag element does not display new MediaTracks when added, so you have to manually reattach the media stream
            conversation.addResource(message.body.newConstraints, message,function(){reattachMediaStream(video0,video0);});  
            break;
        case MessageType.UPDATED:
            break;
        default:
			break;
	}
};


/* This method is the callback for RTC Events. 
	- These events are triggered by the WebRTC engine in the browser as result of the ICE negotiations between the peers.
	- The main events to handle are the “onaddstream”, which indicates that a remote stream was added to the RTCPeerConnection and the “onaddlocalstream” which is the counterpart for locally added streams.
	- The implemented actions just assign the streams to the corresponding video-tags of the html page.
*/
function onRTCEvt(event, evt) {
    // TODO To implement and pass the events up
    switch (event) {

    case 'onnegotiationneeded':
        //onnegotiationNeeded(this);
        //this.rtcEvtHandler(event,evt);
        break;
    case 'onicecandidate':
        break;
    case 'onsignalingstatechange':
        break;
    case 'onaddstream':
        break;
    case 'onremovestream':
        break;
    case 'oniceconnectionstatechange':
        break;
    case 'ondatachannel':
        break;
    case 'onResourceParticipantAddedEvt':
        console.log("onResourceParticipantAddedEvt", evt);
        if(evt.codec.type == "chat"){
            codecChat = evt.codec;
            conversation.dataBroker.addCodec(codecChat);
            codecChat.addListener(onData);
        }
        break;
    case 'onaddlocalstream':
        break;
    default:
        break;
    }
};


/*
function to receive dataChannel messages
In this function to receive MIDI messages from other musics
*/
function onData(code,msg) {
        console.log(msg);

}


/*
In this function to send a MIDI message to other musics
*/
function sentMessageData(midiMessage){
    midiMessage = JSON.stringify(midiMessage);
    var newMessage = new DataMessage(codecChat.id, "", myRtcIdentity, midiMessage);
    codecChat.send(JSON.stringify(newMessage));
    

}


/* This method ends the established communication and performs some cleanup. 
	- Main instruction is “conversation.bye()” which sends a BYE message to the peer and takes care of the RTCPeerConnection and local media cleanup.
*/
function hangup() {
	conversation.bye();
	conversation = null;
}


