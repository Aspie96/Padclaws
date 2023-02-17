import Session from "../../js/session.js"
import KnownRelaysView from "../KnownRelaysView.js"
import UsedRelaysView from "../UsedRelaysView.js"

function addInOrder(array, item, compar) {
	var index = 0;
	while(index < array.length && compar(item, array[index]) > 0) {
		console.log(item, array[index]);
		index++;
	}
	array.splice(index, 0, item);
}

function compStrings(a, b) {
	if(a > b) {
		return 1;
	}
	if(a < b) {
		return -1;
	}
	return 0;
}

export default {
	data() {
		return {
			knownRelays: Session.unusedKnownRelays,
			usedRelays: Session.usedRelays
		}
	},

	components: {
		KnownRelaysView,
		UsedRelaysView
	},

	methods: {
		add(index) {
			const relay = this.knownRelays[index];
			Session.addRelay(relay);
		},

		addAll() {
			Session.addAllRelays();
		},

		remove(index) {
			const relay = this.usedRelays[index];
			Session.removeRelay(relay);
		}
	},

	template: `
	<UsedRelaysView :relays="usedRelays" @remove="remove" />
	<details>
		<summary><span class="ti ti-caret-right"></span><span class="ti ti-caret-down"></span>Custom relays</summary>
		<p>You can use custom relay servers. Add them below, one per line, as websocket addresses.</p>
		<div class="relays-custom-box">
			<label>Custom relays:</label>
			<textarea required name="note" placeholder="wss://relay1.example.com\nwss://relay2.example.com"></textarea>
			<button type="button">Add</button>
		</div>
	</details>
	<KnownRelaysView :relays="knownRelays" @add="add" @addAll="addAll" />
	`
}
