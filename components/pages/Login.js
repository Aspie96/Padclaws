import Session from "../../js/session.js"

export default {
	data() {
		return {
			privateKey: null,
			publicKey: "",
			Session
		};
	},

	methods: {
		async onSubmit() {
			this.Session.login(this.privateKey);
			const path = this.$route.query.page;
			if(path) {
				this.$router.replace(path);
			} else {
				this.$router.push("/");
			}
		},

		privateKeyInput(privateKey) {
			this.privateKey = privateKey;
			this.publicKey = this.Session.toPublicKey(privateKey);
		}
	},

	template: `
	<form @submit.prevent="onSubmit">
		<div class="form-group">
			<label for="private_key">Private key</label>
			<input required :value="privateKey" @input="privateKeyInput($event.target.value)" type="password" name="private_key" id="private_key" autocomplete="off" pattern="[a-f0-9]{64}" minlength="64" maxlength="64" title="Nostr private key as 64 lowercase hexadecimal digits" />
		</div>
		<div class="form-group">
			<label for="public_key" class="label-output">Public key</label>
			<output for="private_key" class="key-output">{{ publicKey }}</output>
		</div>
		<div class="form-buttons">
			<button type="submit" class="btn-submit">Log in</button>
		</div>
	</form>
	`
}
