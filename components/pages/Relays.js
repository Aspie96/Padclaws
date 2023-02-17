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
			knownRelays: [
				"wss://nostr1.lnprivate.network",
				"wss://nostr2.lnprivate.network",
				"wss://nostr3.lnprivate.network",
				"wss://nostr4.lnprivate.network",
				"wss://nostr5.lnprivate.network"
			],
			usedRelays: []
		}
	},

	components: {
		KnownRelaysView,
		UsedRelaysView
	},

	methods: {
		add(index) {
			const relay = this.knownRelays[index];
			this.knownRelays.splice(index, 1);
			addInOrder(this.usedRelays, relay, compStrings);
		},

		addAll() {
			console.log("demo");
			for(const relay of this.knownRelays) {
				addInOrder(this.usedRelays, relay, compStrings);
			}
			this.knownRelays = [];
		},

		remove(index) {
			const relay = this.usedRelays[index];
			this.usedRelays.splice(index, 1);
			addInOrder(this.knownRelays, relay, compStrings);
		}
	},

	template: `
	<UsedRelaysView :relays="usedRelays" @remove="remove" />
	<KnownRelaysView :relays="knownRelays" @add="add" @addAll="addAll" />
	`
}
