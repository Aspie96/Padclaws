import AlertView from "../../AlertView.js"
import UsersCache from "../../UsersCache.js"
import Session from "../../../js/session.js"

export default {
	data() {
		return {
			usernameInput: "",
			aboutInput: ""
		};
	},

	created() {
		this.$watch(
			() => Session.userKeys,
			this.fetchData,
			{ immediate: true }
		);
	},

	components: {
		AlertView
	},

	methods: {
		fetchData() {
			UsersCache.fetchMetadata(Session.userKeys.public);
		},

		onSubmit() {
			const metadata = {
				name: this.usernameInput,
				about: this.aboutInput
			};
			console.log(metadata);
			nostrClient.setMetadata(Session.userKeys, metadata);
		}
	},

	computed: {
		username() {
			return UsersCache.users[Session.userKeys.public]?.metadata?.name;
		},

		about() {
			return UsersCache.users[Session.userKeys.public]?.metadata?.about;
		},

		hexPubKey() {
			return Session.userKeys.public;
		},

		nPubKey() {
			const publicKey = Session.userKeys.public;
			return nostrUtils.encodeEntity(nostrEncEntityPrefixes.npub, publicKey);
		}
	},

	template: `
	<h2>Profile</h2>
	<form @submit.prevent="onSubmit">
		<div class="form-group">
			<label for="public_key" class="label-output">Hex PubKey</label>
			<output class="key-output">{{ hexPubKey }}</output>
		</div>
		<div class="form-group">
			<label for="public_key_npub" class="label-output">nPubKey</label>
			<output class="key-output">{{ nPubKey }}</output>
		</div>
		<div class="form-group">
			<label for="username">Username</label>
			<input :value="username" @input="usernameInput = $event.target.value" name="username" id="username" title="Username" />
		</div>
		<div class="form-group">
			<label for="about">About</label>
			<textarea :value="about" @input="aboutInput" name="about" id="about" title="About youself"></textarea>
		</div>
		<div class="form-buttons">
			<button type="submit" class="btn-submit">Publish</button>
		</div>
	</form>
	<AlertView v-if="saved" color="blue" icon="check">Preferences saved.</AlertView>
	`
}
