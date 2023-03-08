import AlertView from "../AlertView.js"
import Session from "../../js/session.js"

const nPrivRegex = /^nsec[a-zA-HJ-NP-Z0-9]{59}$/;

export default {
	data() {
		return {
			privateKey: null,
			publicKey: null,
			Session,
			showPrivateKey: false
		};
	},

	computed: {
		nPubKey() {
			if(this.publicKey) {
				return nostrUtils.encodeEntity(nostrEncEntityPrefixes.npub, this.publicKey);
			}
		},

		nSecKey() {
			if(this.privateKey) {
				return nostrUtils.encodeEntity(nostrEncEntityPrefixes.nsec, this.privateKey);
			}
		}
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
			if(privateKey != this.privateKey && privateKey != this.nSecKey) {
				this.showPrivateKey = false;
			}
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
				this.privateKey = privateKey;
			} else {
				this.invalid = true;
				this.privateKey = null;
			}
			if(this.privateKey) {
				this.publicKey = this.Session.toPublicKey(this.privateKey);
			} else {
				this.publicKey = null;
			}
		},

		newKeys() {
			const keys = nostrUtils.generateKeys();
			this.privateKey = keys.private;
			document.getElementById("private_key").value = keys.private;
			this.publicKey = keys.public;
			this.showPrivateKey = true;
		}
	},

	components: {
		AlertView
	},

	template: `
	<h1>Log in</h1>
	<div class="text">
		<p>Each Nostr user has a <i>key pair</i>: a <i>public key</i>, which acts as the public identifier of the user, and the corresponding <i>private key</i>, which is kept secret. The private key gives full access to one's account.</p>
		<p>Padclaws never shares your private key with anyone and neither should you.</p>
		<p>If you are a new user of Nostr, you can generate a new key pair.</p>
		<p>Because of how Nostr works, recovering a lost private key is impossible. Please, store your private key securely.</p>
	</div>
	<form @submit.prevent="onSubmit">
		<div class="form-group">
			<label for="private_key">Private key</label>
			<input required @input="privateKeyInput($event.target.value)" type="password" name="private_key" id="private_key" autocomplete="off" pattern="^(npriv[a-zA-HJ-NP-Z0-9]{59})|([a-f0-9]{64})$" maxlength="64" title="Nostr private key in hex or &quote;nsec&quote; format" autofocus />
		</div>
		<div class="form-group">
			<label for="public_key" class="label-output">Hex PubKey</label>
			<output for="private_key" class="key-output">{{ publicKey }}</output>
		</div>
		<div class="form-group">
			<label for="public_key_npub" class="label-output">nPubKey</label>
			<output for="private_key" class="key-output">{{ nPubKey }}</output>
		</div>
		<div class="form-buttons">
			<button type="button" @click="newKeys">New keys</button>
			<button type="submit" class="btn-submit">Log in</button>
		</div>
	</form>
	<AlertView v-if="showPrivateKey" color="blue" icon="key">
		<p>Your private key has been generated and is shown below. Store it securely.</p>
		<p>Your private key can be written in two formats:</p>
		<dl>
			<dt>Hex SecKey</dt>
			<dd class="user-pubkey">{{ privateKey }}</dd>
			<dt>nSecKey</dt>
			<dd class="user-pubkey">{{ nSecKey }}</dd>
		</dl>
	</AlertView>
	`
}
