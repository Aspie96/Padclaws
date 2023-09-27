import AlertView from "../../AlertView.js"
import UsersCache from "../../UsersCache.js"
import Session from "../../../js/session.js"

export default {
	props: {
		logged: Boolean
	},

	data() {
		return {
			username: "",
			about: "",
			website: "",
			published: false,
			publishing: false
		};
	},

	created() {
		this.$watch(
			() => Session.userKeys,
			this.fetchData,
			{ immediate: true }
		);

		this.$watch(
			() => this.cacheData,
			this.refreshData,
			{ immediate: true }
		);
	},

	components: {
		AlertView
	},

	methods: {
		fetchData() {
			UsersCache.fetchMetadata(Session.userKeys.public);
			this.username = this.cacheData.username;
			this.website = this.cacheData.website;
			this.about = this.cacheData.about;
		},

		refreshData() {
			this.username = this.cacheData.username;
			this.website = this.cacheData.website;
			this.about = this.cacheData.about;
		},
		
		async onSubmit() {
			const metadata = {
				name: this.username,
				website: this.website,
				about: this.about
			};
			console.log(metadata);
			this.published = false;
			this.publishing = true;
			await nostrClient.setMetadata(Session.userKeys, metadata);
			this.published = true;
			this.publishing = false;
		}
	},

	computed: {
		cacheData() {
			return {
				username: UsersCache.users[Session.userKeys.public]?.metadata?.name,
				website: UsersCache.users[Session.userKeys.public]?.metadata?.website,
				about: UsersCache.users[Session.userKeys.public]?.metadata?.about
			};
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
	<div class="text">
		<p>In this page you can set the public settings of your profile.</p>
	</div>
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
			<input type="text" v-model="username" name="username" id="username" title="Username" />
		</div>
		<div class="form-group">
			<label for="website">Website</label>
			<input type="url" v-model="website" name="website" id="website" title="Website" />
		</div>
		<div class="form-group">
			<label for="about">About</label>
			<textarea v-model="about" name="about" id="about" title="About youself"></textarea>
		</div>
		<div class="form-buttons">
			<button type="submit" class="btn-submit" :disabled="publishing">Publish</button>
		</div>
	</form>
	<AlertView v-if="published" color="blue" icon="check">Profile information published.</AlertView>
	`
}
