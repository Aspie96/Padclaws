import Session from "../js/session.js"
import UsersCache from "./UsersCache.js"

export default {
	props: {
		pubkey: String,
	},

	created() {
		this.$watch(
			() => this.pubkey,
			this.fetchData,
			{ immediate: true }
		);
	},

	computed: {
		selfUser() {
			return Session.logged && Session.userKeys.public == this.pubkey;
		},

		username() {
			return UsersCache.users[this.pubkey]?.metadata?.name;
		},

		about() {
			return UsersCache.users[this.pubkey]?.metadata?.about;
		},

		following() {
			if(!Session.logged) {
				return false;
			}
			console.log(Session.followedUsers);
			return Session.followedUsers.has(this.pubkey);
		}
	},

	created() {
		this.$watch(
			() => this.event,
			this.fetchData,
			{ immediate: true }
		);
	},

	methods: {
		fetchData() {
			UsersCache.fetchMetadata(this.pubkey);
		},

		follow() {
			Session.followUser(this.pubkey);
		},

		unfollow() {
			console.log("unfollow");
			Session.unfollowUser(this.pubkey);
		}
	},

	template: `
	<div class="user-box">
		<div class="user-data">
			<RouterLink v-if="username" class="username" :title="pubkey" :to="{ name: 'user', params: { pubkey } }">{{ username }}</RouterLink>
			<RouterLink class="user-pubkey" :title="pubkey" :to="{ name: 'user', params: { pubkey } }">{{ pubkey }}</RouterLink>
		</div>
		<p class="about">{{ about }}</p>
		<button v-if="following" type="button" class="user-page-btn user-page-btn-right" @click="unfollow"><span class="ti ti-social-off"></span>Unfollow</button>
		<button v-else type="button" class="user-page-btn user-page-btn-right" @click="follow"><span class="ti ti-social"></span>Follow</button>
	</div>
	`
}
