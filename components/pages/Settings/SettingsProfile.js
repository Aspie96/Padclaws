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
			display_name: "",
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
			this.display_name = this.cacheData.display_name;
			this.website = this.cacheData.website;
			this.about = this.cacheData.about;
		},

		refreshData() {
			this.username = this.cacheData.username;
			this.display_name = this.cacheData.display_name;
			this.website = this.cacheData.website;
			this.about = this.cacheData.about;
		},
		
		async onSubmit() {
			const metadata = {
				...UsersCache.users[Session.userKeys.public]?.metadata,
				name: this.username,
				about: this.about
			};
			if(this.website) {
				metadata.website = this.website;
			} else {
				delete metadata.website;
			}
			if(this.display_name) {
				metadata.website = this.website;
			} else {
				delete metadata.display_name;
			}
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
			console.log(UsersCache.users[Session.userKeys.public]?.metadata);
			return {
				username: UsersCache.users[Session.userKeys.public]?.metadata?.name,
				display_name: UsersCache.users[Session.userKeys.public]?.metadata?.display_name,
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
			<label for="display_name">Display name</label>
			<input type="text" v-model="display_name" name="display_name" id="display_name" title="Display name" />
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
