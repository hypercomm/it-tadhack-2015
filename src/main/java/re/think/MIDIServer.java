package re.think;

import static java.lang.System.out;

import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

import io.vertx.core.AbstractVerticle;
import io.vertx.core.AsyncResult;
import io.vertx.core.DeploymentOptions;
import io.vertx.core.Future;
import io.vertx.core.Handler;
import io.vertx.core.Vertx;
import io.vertx.core.VertxException;
import io.vertx.core.eventbus.EventBus;
import io.vertx.core.http.HttpServer;
import io.vertx.core.http.HttpServerOptions;
import io.vertx.core.json.JsonObject;
import io.vertx.core.shareddata.LocalMap;
import io.vertx.ext.apex.Router;
import io.vertx.ext.apex.handler.AuthHandler;
import io.vertx.ext.apex.handler.BasicAuthHandler;
import io.vertx.ext.apex.handler.BodyHandler;
import io.vertx.ext.apex.handler.CookieHandler;
import io.vertx.ext.apex.handler.SessionHandler;
import io.vertx.ext.apex.handler.sockjs.BridgeOptions;
import io.vertx.ext.apex.handler.sockjs.PermittedOptions;
import io.vertx.ext.apex.sstore.LocalSessionStore;
import io.vertx.ext.auth.AuthProvider;

public class MIDIServer extends AbstractVerticle {
	//<user, Principal>
	//final Map<String, SmartdataPrincipal> sessions = new HashMap<>();
	final Map<String, String> userTypes = new HashMap<>();
	
	//final Authentication authentication = SecurityConfig.getInstance().getAuthenticationHandler();
	//final Authorization authorization = SecurityConfig.getInstance().getAuthorizationHanlder();
	
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
		eb.consumer("auth.to.server").handler(message -> {
			final JsonObject json = (JsonObject)message.body();
			final String id = json.getString("open");
			final String user = json.getString("user");
			
			//http://193.136.93.134:8080/smartdata-idmanagement/entity.jsp
			//password - xpto
			/* tim 		- music
			 * alice 	- music
			 * bob		- client
			 */
			
			/*
			String type = "client";
			try {
				SmartdataPrincipal principal = sessions.get(user);
				principal = authorization.getGroups(principal);
				type = principal.getGroups().get(0).getName();
			} catch (Exception e) {
				e.printStackTrace();
				//default to client...
			}
			*/
			
			String type;
			if(user.equals("tim") || user.equals("alice")) {
				type = "music";
			} else {
				type = "client";
			}
			
			userTypes.put(user, type);
			out.println(user + ":" + id + " -> " + type);
			message.reply(new JsonObject().put("id", id).put("type", type). put("user", user));
		});
		
		eb.consumer("midi.to.server").handler(message -> {
			final JsonObject json = (JsonObject)message.body();
			final String id = json.getString("id");
			final String user = json.getString("user");
			out.println(json);
			
			if(userTypes.get(user).equals("client")) return; //ignore client MIDI messages, if any!
			
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
		options.addInboundPermitted(new PermittedOptions().setAddress("auth.to.server"));
		options.addInboundPermitted(new PermittedOptions().setAddress("midi.to.server"));
		options.addOutboundPermitted(new PermittedOptions().setAddressRegex(".*"));
		
		final SockJSHandlerHack sockJSHandler = new SockJSHandlerHack(vertx);
		sockJSHandler.bridge(options);
		sockJSHandler.setHook(new BridgeHook(vertx));
		
		final AuthProvider authProvider = new AuthProvider() {
			@Override
			public void login(JsonObject principal, JsonObject credentials, Handler<AsyncResult<Void>> resultHandler) {
				//out.println("(username, password) -> (" + principal.getString("username") + ", " + credentials.getString("password") + ")");
				
				final String user = principal.getString("username");
				final String pass = credentials.getString("password");
				
			    vertx.executeBlocking((Future<Void> fut) -> {
			    	/*
			    	try {
						SmartdataPrincipal result = authentication.login(user, pass);
						sessions.put(user, result);
						fut.complete();
					} catch (Exception e) {
						throw new VertxException("Auth - Failed");
					}
					*/
			    	
			    	
					if((user.equals("alice") || user.equals("tim") || user.equals("bob")) && pass.equals("xpto")) {
						out.println("login - OK");
						fut.complete();
					} else {
						throw new VertxException("Auth - Failed");
					}
					
			    }, resultHandler);
			}
			
			@Override
			public void hasRole(JsonObject principal, String role, Handler<AsyncResult<Boolean>> resultHandler) {
				out.println("hasRole("+role+") - username: " + principal.getString("username"));
				resultHandler.handle(Future.succeededFuture(true)); //alternative response, non-blocking option
			}
			
			@Override
			public void hasPermission(JsonObject principal, String permission, Handler<AsyncResult<Boolean>> resultHandler) {
				out.println("hasPermission - username: " + principal.getString("username"));
				resultHandler.handle(Future.succeededFuture(true)); //alternative response, non-blocking option
			}
		};
		
		final AuthHandler basicAuthHandler = BasicAuthHandler.create(authProvider);
		
		final Router router = Router.router(vertx);
		router.route().handler(CookieHandler.create());
		router.route().handler(SessionHandler.create(LocalSessionStore.create(vertx)));
		router.route().handler(BodyHandler.create());
		router.route("/eventbus/*").handler(basicAuthHandler);
		router.route("/eventbus/*").handler(sockJSHandler);
		
		final HttpServerOptions httpOptions = new HttpServerOptions();
		httpOptions.setTcpKeepAlive(true);
		//httpOptions.setIdleTimeout(10);
		
		final HttpServer server = vertx.createHttpServer(httpOptions);
		server.requestHandler(router::accept).listen(8080);
		System.out.println("MIDI - Listening on port 8080...");
	}

}
