package re.think;

import io.vertx.core.Vertx;
import io.vertx.ext.apex.handler.sockjs.BridgeOptions;
import io.vertx.ext.apex.handler.sockjs.EventBusBridgeHook;
import io.vertx.ext.apex.handler.sockjs.SockJSHandler;
import io.vertx.ext.apex.handler.sockjs.SockJSHandlerOptions;
import io.vertx.ext.apex.handler.sockjs.impl.EventBusBridgeImpl;
import io.vertx.ext.apex.handler.sockjs.impl.SockJSHandlerImpl;

public class SockJSHandlerHack extends SockJSHandlerImpl {
	private Vertx vertxHack;
	private EventBusBridgeImpl bridgeHack;
	
	public SockJSHandlerHack(Vertx vertx) {
		super(vertx, new SockJSHandlerOptions());
		this.vertxHack = vertx;
	}
	
	@Override
	public SockJSHandler bridge(BridgeOptions bridgeOptions) {
		this.bridgeHack = new EventBusBridgeImpl(vertxHack, bridgeOptions);
	    socketHandler(bridgeHack);
	    return this;
	}
	
	public SockJSHandlerHack setHook(EventBusBridgeHook hook) {
		bridgeHack.setHook(hook);
		super.setHook(hook);
	    return this;
	}
}
