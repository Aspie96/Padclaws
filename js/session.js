export default Vue.reactive({
	logged: false,
	userKeys: null,

	login(privateKey) {
		const publicKey = nostrUtils.getPublicKey(privateKey);
		this.logged = true;
		this.userKeys = {
			public: publicKey,
			private: privateKey
		};
	},

	logout() {
		this.logged = false;
		this.userKeys = null;
	},

	toPublicKey(privateKey) {
		const keyRegex = /^[a-f0-9]{64}$/;
		if(!keyRegex.test(privateKey)) {
			return null;
		}
		return nostrUtils.getPublicKey(privateKey);
	}
});
