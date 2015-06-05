package re.think;

import static java.lang.System.out;

import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

import io.vertx.core.AbstractVerticle;
import io.vertx.core.DeploymentOptions;
import io.vertx.core.Vertx;
import io.vertx.core.eventbus.EventBus;
import io.vertx.core.http.HttpServer;
import io.vertx.core.http.HttpServerOptions;
import io.vertx.core.json.JsonObject;
import io.vertx.core.shareddata.LocalMap;
import io.vertx.ext.apex.Router;
import io.vertx.ext.apex.handler.BodyHandler;
import io.vertx.ext.apex.handler.CookieHandler;
import io.vertx.ext.apex.handler.SessionHandler;
import io.vertx.ext.apex.handler.sockjs.BridgeOptions;
import io.vertx.ext.apex.handler.sockjs.PermittedOptions;
import io.vertx.ext.apex.handler.sockjs.SockJSHandler;
import io.vertx.ext.apex.sstore.LocalSessionStore;

public class MIDIServer extends AbstractVerticle {
	public static void main(String[] args) {
		final Vertx vertx = Vertx.vertx();
		vertx.deployVerticle(new MIDIServer());
	}

	@Override
	public void start() throws Exception {
		final LocalMap<String, String> playStatus = vertx.sharedData().getLocalMap("play-status"); 	//control of play worker verticle (inner blocking for)
		final Map<String, StringBuilder> playList = new HashMap<>();								//record play
		final List<String> recording = new LinkedList<String>(); 									//participants recording
		
		vertx.deployVerticle(new PlayVerticle(), new DeploymentOptions().setWorker(true));
		
		final EventBus eb = vertx.eventBus();
		eb.consumer("midi.to.server").handler(message -> {
			final JsonObject json = (JsonObject)message.body();
			final String id = json.getString("id");
			out.println(json);
			
			if(json.containsKey("key")) {
				eb.publish("midi.to.client", json);
				
				if(!recording.isEmpty()) {
					for(String idRecording: recording) {
						final StringBuilder sb = playList.get(idRecording);
						sb.append(json.getString("key"));
						sb.append(",");
						sb.append(json.getString("event"));
						sb.append(",");
						sb.append(System.currentTimeMillis());
						sb.append(" ");
					}
				}
			} else if(json.containsKey("event")) {
				final String jsonStatus = json.getString("event");
				playStatus.put(id, jsonStatus);
				
				StringBuilder sb = playList.get(id);
				if(sb == null) {
					sb = new StringBuilder();
					playList.put(id, sb);
				}
				
				if(jsonStatus.equals("RECORD")) {
					recording.add(id);
					sb.delete(0, sb.length());
				}
				
				if(jsonStatus.equals("STOP")) {
					recording.remove(id);
				}
					
				if(jsonStatus.equals("PLAY")) {
					final String data = sb.toString();
					if(!data.isEmpty()) {
						//Create worker for every play??
						eb.send("midi.play", new JsonObject().put("id", id).put("data", data));
					}
				}
				
			}
		});
		
		
		final BridgeOptions options = new BridgeOptions();
		options.addInboundPermitted(new PermittedOptions().setAddress("midi.to.server"));
		options.addOutboundPermitted(new PermittedOptions().setAddressRegex(".*"));
		
		final SockJSHandler sockJSHandler = SockJSHandler.create(vertx);
		sockJSHandler.bridge(options);
		
		final Router router = Router.router(vertx);
		router.route().handler(CookieHandler.create());
		router.route().handler(SessionHandler.create(LocalSessionStore.create(vertx)));
		router.route().handler(BodyHandler.create());
		router.route("/eventbus/*").handler(sockJSHandler);
		
		final HttpServerOptions httpOptions = new HttpServerOptions();
		httpOptions.setTcpKeepAlive(true);
		//httpOptions.setIdleTimeout(10);
		
		final HttpServer server = vertx.createHttpServer(httpOptions);
		server.requestHandler(router::accept).listen(8080);
		System.out.println("MIDI - Listening on port 8080...");
	}

}
