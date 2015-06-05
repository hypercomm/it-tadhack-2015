package re.think;

import io.vertx.core.AbstractVerticle;
import io.vertx.core.eventbus.EventBus;
import io.vertx.core.json.JsonObject;
import io.vertx.core.shareddata.LocalMap;

public class PlayVerticle extends AbstractVerticle {
	long time = 0;
	long nextTime = 0;
	
	@Override
	public void start() throws Exception {
		final LocalMap<String, String> playStatus = vertx.sharedData().getLocalMap("play-status");
		
		final EventBus eb = vertx.eventBus();
		eb.consumer("midi.play").handler(message -> {
			final JsonObject obj = (JsonObject)message.body();
			
			final String id = obj.getString("id");
			final String data = obj.getString("data");

			time = 0;
			final String[] notes = data.split(" ");
			for(String note: notes) {
				if(playStatus.get(id).equals("STOP") || note.isEmpty()) break;
				play(note);
			}
		});
	}
	
	private void play(String note) {
		final EventBus eb = vertx.eventBus();
		
		final String[] s = note.split(",");
		final JsonObject obj = new JsonObject()
			.put("id", "record")
			.put("key", s[0] + "," + s[1])
			.put("event", s[2]);
		
		if(time == 0)
			time = Long.parseLong(s[3]);
		
		nextTime = Long.parseLong(s[3]);
		
		try {
			Thread.sleep(nextTime - time);
			time = nextTime;
			eb.publish("midi.to.client", obj);
		} catch (InterruptedException e) {
			e.printStackTrace();
		}
	}
}
