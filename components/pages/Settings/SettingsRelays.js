import AlertView from "../../AlertView.js"
import Session from "../../../js/session.js"
import SuggestedRelaysView from "../../SuggestedRelaysView.js"
import UsedRelaysView from "../../UsedRelaysView.js"

const ws_regex = /^(?:(?:wss?:)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?$/i;

export default {
	props: {
		logged: Boolean
	},

	data() {
		return {
			relays: Session.relays,
			customRelaysStr: "",
			wrongRelays: [],
			saved: false
		};
	},

	components: {
		AlertView,
		SuggestedRelaysView,
		UsedRelaysView
	},

	methods: {
		add(relay) {
			this.saved = false;
			Session.addRelay(relay, true, true);
			this.saved = true;
		},

		addAll() {
			this.saved = false;
			Session.addAllRelays();
			this.saved = true;
		},

		remove(relay) {
			this.saved = false;
			Session.removeRelay(relay, true, true);
			this.saved = true;
		},

		readWriteChange(relay, read, write) {
			this.saved = false;
			Session.setRelay(relay, read, write);
			this.saved = true;
		},

		addCustom() {
			this.saved = false;
			var relays = this.customRelaysStr.split("\n");
			relays = relays.map(relay => relay.trim());
			relays = relays.filter(relay => relay);
			this.wrongRelays = relays.filter(relay => !ws_regex.test(relay));
			if(this.wrongRelays.length > 0) {
				return;
			}
			if(relays.length > 0) {
				relays = relays.map(relay => new URL(relay).href);
				Session.addCustomRelays(relays, true, true);
				this.saved = true;
			}
			this.customRelaysStr = "";
		}
	},

	template: `
	<h2>Relays</h2>
	<div class="text">
		<p>Whenever you publish a note or other stuff, you send it to any number of independently-run <i>relays</i> (Nostr servers) at your choice. Likewise, when you fetch notes from other users, you query any number of relays at your choice.</p>
		<p>On this page you can chose what relays to communicate with. You should use multiple relays to increase decentralization and connectivity with other users.</p>
		<p>Please note that the relays you communicate with receive your IP address and other navigation data along with the content of your requests (including your public key when needed).</p>
	</div>
	<UsedRelaysView :relays="relays.used" legend="Used relays" @remove="remove" @readWriteChange="readWriteChange" />
	<details>
		<summary><span class="ti ti-caret-right"></span><span class="ti ti-caret-down"></span>Custom relays</summary>
		<p>You can use custom relays. Add them below, one per line, as WebSocket URIs.</p>
		<div class="relays-custom-box">
			<label for="custom-relays">Custom relays:</label>
			<textarea v-model="customRelaysStr" name="custom-relays" id="custom-relays" placeholder="wss://relay1.example.com/\nwss://relay2.example.com/"></textarea>
			<button type="button" @click="addCustom">Add</button>
		</div>
		<AlertView v-if="wrongRelays.length" color="red" icon="alert-triangle">
			<span>The following are not valid WebSocket URIs:</span>
			<ul class="list">
				<li v-for="relay in wrongRelays" @key="relay">
					<span class="relay-value-red">{{ relay }}</span>
				</li>
			</ul>
		</AlertView>
	</details>
	<div class="text">
		<p>A list of known independently-run relays is provided below for your convenience.</p>
		<p>This list is merely meant to inform you about the existence of these relays, and does not equal endorsement, as the relays are run by third parties.</p>
	</div>
	<SuggestedRelaysView :relays="relays.unusedKnown" legend="Known relays" @add="add" @addAll="addAll" />
	<AlertView v-if="saved" color="blue" icon="check">Preferences saved.</AlertView>
	`
}
