
// Default settings to be used by IDP Server, Vertx Msg Server and Vertx Msg Stub
// Should be colocated with Vertx server.java


 idp_options = 
	{
		protocol : "ws", 
		domain : "localhost", 
		port : "28017", 
		path: "/idp/index.php?jsonp=returnIdentity&filter_rtcIdentity="
	}

// URL to get domain messagingStub url

domainUrl = "http://"+idp_options.domain +"/libs/wonder/MessagingStub_PTIN.js"
servicesRegistryAddress = "test.my_persistor"


// IDP options for websockets, if nothing is given on application layer
// points to idp mongo
/*
var idp_options  = {
	protocol: "ws",
	domain: "150.140.184.246",
	port: "28017",
	path: "",
	wsQuery: wsQuery
}
*/
    
// Default IDP options, if nothing is given on application layer
// points to idp mongo 
/*var idp_options = 
	{
		protocol : "http", 
		domain : "150.140.184.246", 
		port : '28017', 
		path: "/webrtc/users/?jsonp=returnIdentity&filter_rtcIdentity="
	};
*/

// Address of Vertx WONDER Message Server

vertx_settings = 
	{
    address: "http://"+idp_options.domain + ":4040/eventbus",
	//key_store_path: "cert2/server-keystore.jks"
	
	}

// ICE Servers

		var TURN = {
        url:"turn:150.140.184.242:3478", 
        username: "wonder", 
        credential:"w0nd3r"
        };
        var STUN ={url: "stun:150.140.184.242:3478"};

		iceServers = { "iceServers": [STUN, TURN]};
