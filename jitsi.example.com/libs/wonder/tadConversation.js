//api for tadhack

/**
 * @fileOverview 
 * @author Luis Oliveira <luis96oliveira@gmail.com>
 */


/**
 * tadConversation class
 * @class
 * @param myIdentity 
 * @param listMusics list of musics in show
 * @param nameOfShow the name of show
 * @param onMessageHandler {@link Message} handler to receive and process the MIDI Messages
 *
 */
function tadConversation(myIdentity, listMusics, nameOfShow, onMessageHandler) {
    
    // the real conversation in Wonder API
	this.realConversation = new Conversation();
	// list of musics in show
	this.musics = listMusics;
	// the name of show
	this.name = nameOfShow;
	// myIdentity
	this.myParticipant = new Participant(myIdentity);
	// contextId of conversation
	this.contextId;

}


/**
 * A Conversation is opened for invited musics. 
 * Creates the remote musics 
 * creates the peer connection, connects to the stub and sends invitation
 * 
 * @param {string[]} array list of musics to show
 * @@onMessageHandler  handle responses for the MIDI API
 */
tadConversation.prototype.open = function (arrayMusicos, onMessageHandler) {
    openaConversation();
};

/**
 * Close a Conversation 
 * 
 */
tadConversation.prototype.close = function(){

};

/**
 * Send a message 
 * 
 * @message message MIDI from API
 */
tadConversation.prototype.sendMessage = function(message){

};