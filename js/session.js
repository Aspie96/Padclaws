import UsersCache from "../components/UsersCache.js"

var logged = false;
var userKeys = null;

const storedKey = sessionStorage.getItem("privateKey");

if(nostrUtils.isHash(storedKey, 32)) {
	logged = true;
	const publicKey = nostrUtils.getPublicKey(storedKey);
	userKeys = {
		public: publicKey,
		private: storedKey
	};
} else {
	sessionStorage.removeItem("privateKey");
}

var relays = localStorage.getItem("relays");
if(relays) {
	relays = JSON.parse(relays);
	for(const relay in relays) {
		nostrClient.addRelay(relay, relays[relay].read, relays[relay].write);
	}
}


const session = Vue.reactive({
	logged,
	userKeys,
	relays: {
		known: null,
		used: [],
		unusedKnown: []
	},

	login(privateKey) {
		const publicKey = nostrUtils.getPublicKey(privateKey);
		this.logged = true;
		this.userKeys = {
			public: publicKey,
			private: privateKey
		};
		UsersCache.fetchMetadata(publicKey);
		sessionStorage.setItem("privateKey", privateKey);
	},

	logout() {
		this.logged = false;
		this.userKeys = null;
		sessionStorage.removeItem("privateKey");
	},

	toPublicKey(privateKey) {
		if(!nostrUtils.isHash(privateKey, 32)) {
			return null;
		}
		return nostrUtils.getPublicKey(privateKey);
	},

	async refreshRelays(store) {
		if(!this.relays.known) {
			this.relays.known = await (await fetch("data/relays.json")).json();
		}
		const usedRelays = nostrClient.getRelays();
		this.relays.used = Object.entries(usedRelays);
		this.relays.used.sort((a, b) => a[0].localeCompare(b[0]));
		this.relays.unusedKnown = this.relays.known.filter(relay => !(relay in usedRelays));
		if(store) {
			localStorage.setItem("relays", JSON.stringify(usedRelays));
		}
	},

	addRelay(relay, read, write) {
		nostrClient.addRelay(relay, read, write);
		this.refreshRelays(true);
	},

	setRelay(relay, read, write) {
		nostrClient.setRelay(relay, read, write);
		this.refreshRelays(true);
	},

	addAllRelays() {
		this.addCustomRelays(this.relays.unusedKnown, true, true);
	},

	removeRelay(relay) {
		nostrClient.removeRelay(relay);
		this.refreshRelays(true);
	},

	replaceRelays(relays) {
		for(const [relay, config] of this.relays.used) {
			if(!(relay in relays)) {
				nostrClient.removeRelay(relay);
			}
		}
		for(const relay in relays) {
			nostrClient.setRelay(relay, relays[relay].read, relays[relay].write);
		}
		this.refreshRelays(false);
	},

	addCustomRelays(relays, read, write) {
		for(const relay of relays) {
			nostrClient.addRelay(relay, read, write);
		}
		this.refreshRelays(true);
	}
});

session.refreshRelays();

window.addEventListener("storage", e => {
	if(e.key == "relays") {
		const relays = JSON.parse(e.newValue);
		session.replaceRelays(relays);
	}
});

export default session;
