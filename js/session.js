const keyRegex = /^[a-f0-9]{64}$/;

var logged = false;
var userKeys = null;

const storedKey = sessionStorage.getItem("privateKey");

if(keyRegex.test(storedKey)) {
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
	relays = JSON.parse(localStorage.getItem("relays"))
	for(const relay of relays) {
		nostrClient.addRelay(relay);
	}
}


const session = Vue.reactive({
	logged,
	userKeys,
	knownRelays: null,
	usedRelays: [],
	unusedKnownRelays: [],

	login(privateKey) {
		const publicKey = nostrUtils.getPublicKey(privateKey);
		this.logged = true;
		this.userKeys = {
			public: publicKey,
			private: privateKey
		};
		sessionStorage.setItem("privateKey", privateKey);
	},

	logout() {
		this.logged = false;
		this.userKeys = null;
		sessionStorage.removeItem("privateKey");
	},

	toPublicKey(privateKey) {
		if(!keyRegex.test(privateKey)) {
			return null;
		}
		return nostrUtils.getPublicKey(privateKey);
	},

	async refreshRelays(store) {
		if(!this.knownRelays) {
			this.knownRelays = await (await fetch("../data/relays.json")).json();
		}
		this.usedRelays.splice(0, this.usedRelays.length, ...nostrClient.getRelays());
		this.unusedKnownRelays.splice(0, this.unusedKnownRelays.length, ...this.knownRelays.filter(relay => !this.usedRelays.includes(relay)));
		if(store) {
			localStorage.setItem("relays", JSON.stringify(this.usedRelays));
		}
	},

	addRelay(relay) {
		nostrClient.addRelay(relay);
		this.refreshRelays(true);
	},

	addAllRelays() {
		this.addCustomRelays(this.unusedKnownRelays);
	},

	removeRelay(relay) {
		nostrClient.removeRelay(relay);
		this.refreshRelays(true);
	},

	replaceRelays(relays) {
		for(const relay of this.usedRelays) {
			if(!relays.includes(relay)) {
				nostrClient.removeRelay(relay);
			}
		}
		for(const relay of relays) {
			nostrClient.addRelay(relay);
		}
		this.refreshRelays(false);
	},

	addCustomRelays(relays) {
		for(const relay of relays) {
			nostrClient.addRelay(relay);
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
