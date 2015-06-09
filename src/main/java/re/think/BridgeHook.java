package re.think;

import static java.lang.System.out;
import io.vertx.core.AsyncResult;
import io.vertx.core.Handler;
import io.vertx.core.Vertx;
import io.vertx.core.eventbus.EventBus;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.apex.handler.sockjs.EventBusBridgeHook;
import io.vertx.ext.apex.handler.sockjs.SockJSSocket;

public class BridgeHook implements EventBusBridgeHook {
	final Vertx vertx;
	final EventBus eb;	
	
	public BridgeHook(Vertx vertx) {
		this.vertx = vertx;
		eb = vertx.eventBus();
	}
	
	@Override
	public boolean handleSocketCreated(SockJSSocket sock) {
		//out.println("Origin is " + sock.headers().get("origin"));
		return true;
	}

	public void handleSocketClosed(SockJSSocket sock) {
		//out.println("handleSocketClosed, sock = " + sock);
	}

	public boolean handlePreRegister(SockJSSocket sock, String address) {
		//out.println("REGISTER: " + usernameInSession(sock) + " -> " + address);
		
		//TRUE  -> register address, fit to receive messages
		//FALSE -> can't receive messages in this address, although it's possible to receive reply's
		return true;
	}

	public void handlePostRegister(SockJSSocket sock, String address) {
		//out.println("handlePostRegister, sock = " + sock + ", address = " + address);
	}

	public boolean handleUnregister(SockJSSocket sock, String address) {
		//out.println("handleUnregister, sock = " + sock + ", address = " + address);
		return true;
	}
	
	public boolean handleSendOrPub(SockJSSocket sock, boolean send, JsonObject msg, String address) {
		final JsonObject body = msg.getJsonObject("body");
		body.remove("user"); //remove any client injected user (for security reasons)
		body.put("user", usernameInSession(sock));
		
		return true;
	}

	@Override
	public boolean handleAuthorise(JsonObject message, String sessionID, Handler<AsyncResult<Boolean>> handler) {
		out.println("handleAuthorise, sessionID = " + sessionID);
		return false;
	}
	
	
	private String usernameInSession(SockJSSocket sock) {
		return sock.apexSession().getPrincipal().getString("username");
	}
}
