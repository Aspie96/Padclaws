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

	async refreshRelays() {
		if(!this.knownRelays) {
			this.knownRelays = await (await fetch("../data/relays.json")).json();
		}
		this.usedRelays.splice(0, this.usedRelays.length, ...nostrClient.getRelays());
		this.unusedKnownRelays.splice(0, this.unusedKnownRelays.length, ...this.knownRelays.filter(relay => !this.usedRelays.includes(relay)));
	},

	addRelay(relay) {
		nostrClient.addRelay(relay);
		this.refreshRelays();
	},

	addAllRelays() {
		for(const relay of this.unusedKnownRelays) {
			nostrClient.addRelay(relay);
		}
		this.refreshRelays();
	},

	removeRelay(relay) {
		nostrClient.removeRelay(relay);
		this.refreshRelays();
	}
});

session.refreshRelays();

export default session;
