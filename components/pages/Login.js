import Session from "../../js/session.js"

const nPrivRegex = /^nsec[a-zA-HJ-NP-Z0-9]{59}$/;

export default {
	data() {
		return {
			privateKey: null,
			hexPubKey: null,
			nPubKey: null,
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
			console.log("demo");
			if(privateKey.startsWith(nostrEncEntityPrefixes.nsec)) {
				if(nPrivRegex.test(privateKey)) {
					const decoded = nostrUtils.decodeEntity(privateKey);
					if(decoded && decoded.prefix == nostrEncEntityPrefixes.nsec && nostrUtils.isHash(decoded.hex, 32)) {
						this.invalid = false;
						this.privateKey = decoded.hex;
					} else {
						this.invalid = true;
						this.privateKey = null;
					}
				} else {
					this.invalid = true;
					this.privateKey = null;
				}
			} else if(nostrUtils.isHash(privateKey, 32)) {
				console.log("demo");
				this.privateKey = privateKey;
			} else {
				this.invalid = true;
				this.privateKey = null;
			}
			if(this.privateKey) {
				this.hexPubKey = this.Session.toPublicKey(this.privateKey);
				this.nPubKey = nostrUtils.encodeEntity(nostrEncEntityPrefixes.npub, this.hexPubKey);
			} else {
				this.hexPubKey = null;
				this.nPubKey = null;
			}
		}
	},

	template: `
	<h1>Log in</h1>
	<div class="text">
		<p>Each Nostr user has a <i>key pair</i>: a <i>public key</i>, which acts as the public identifier of the user, and the corresponding <i>private key</i>, which is kept secret. The private key gives full access to one's account.</p>
		<p>Padclaws never shares your private key with anyone and neither should you.</p>
		<p>Because of how Nostr works, recovering a lost private key is impossible. Please, store your private key securely.</p>
	</div>
	<form @submit.prevent="onSubmit">
		<div class="form-group">
			<label for="private_key">Private key</label>
			<input required @input="privateKeyInput($event.target.value)" type="password" name="private_key" id="private_key" autocomplete="off" pattern="^(npriv[a-zA-HJ-NP-Z0-9]{59})|([a-f0-9]{64})$" maxlength="64" title="Nostr private key in hex or &quote;nsec&quote; format" autofocus />
		</div>
		<div class="form-group">
			<label for="public_key" class="label-output">Hex PubKey</label>
			<output for="private_key" class="key-output">{{ hexPubKey }}</output>
		</div>
		<div class="form-group">
			<label for="public_key_npub" class="label-output">nPubKey</label>
			<output for="private_key" class="key-output">{{ nPubKey }}</output>
		</div>
		<div class="form-buttons">
			<button type="submit" class="btn-submit">Log in</button>
		</div>
	</form>
	`
}
