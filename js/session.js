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

export default Vue.reactive({
	logged,
	userKeys,

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
	}
});
