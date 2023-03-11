import AlertView from "../AlertView.js"
import Session from "../../js/session.js"
import UsersCache from "../UsersCache.js"

const DEFAULT_TITLE = "Padclaws";

export default {
	data() {
		return {
			invalid: false,
			pubkey: null,
			noRelays: false
		};
	},

	created() {
		this.$watch(
			() => this.$route.params,
			this.fetchData,
			{ immediate: true }
		);

		this.$watch(
			() => this.metadata,
			this.setTitle,
			{ immediate: true }
		);
	},

	computed: {
		metadata() {
			return UsersCache.users[this.pubkey]?.metadata;
		},

		pubkeyNormal() {
			return UsersCache.users[this.pubkey]?.pubkey || this.pubkey;
		},

		selfUser() {
			return Session.logged && Session.userKeys.public.startsWith(this.pubkey);
		},

		followed() {
			return Session.followedUsers.has(this.pubkey);
		}
	},

	methods: {
		fetchData() {
			this.noRelays = false;
			this.invalid = false;
			this.pubkey = this.$route.params.pubkey;
			if(nostrClient.noRelays()) {
				this.noRelays = true;
				return;
			}
			if(!nostrUtils.isHashPrefix(this.pubkey, 32)) {
				const decoded = nostrUtils.decodeEntity(this.pubkey);
				if(decoded && decoded.prefix == nostrEncEntityPrefixes.npub && nostrUtils.isHash(decoded.hex, 32)) {
					this.$router.replace({
						name: this.$route.matched[this.$route.matched.length - 1].name,
						params: {
							pubkey: decoded.hex
						}
					});
				} else {
					this.invalid = true;
				}
				return;
			}
			UsersCache.fetchMetadata(this.pubkey);
		},

		setTitle() {
			this.$nextTick(() => {
				document.title = this.metadata?.name || DEFAULT_TITLE;
			});
		},

		follow() {
			Session.followUser(this.pubkey);
		},

		unfollow() {
			Session.unfollowUser(this.pubkey);
		}
	},

	components: {
		AlertView
	},

	template:`
	<AlertView v-if="noRelays" color="yellow" icon="alert-triangle">
		<p>No relays set.</p>
		<p>Before fetching data, you must add some <RouterLink :to="{ name: 'settings-relays' }">relays</RouterLink>.</p>
	</AlertView>
	<AlertView v-else-if="invalid" color="red" icon="alert-triangle">Invalid public key. Check the URL.</AlertView>
	<template v-else>
		<h1>{{ metadata?.name }}</h1>
		<RouterLink v-if="selfUser" :to="{ name: 'settings-profile' }" class="edit-profile-link edit-profile-link-right">Edit profile</RouterLink>
		<button v-if="followed" type="button" @click="unfollow">Unfollow</button>
		<button v-else type="button" @click="follow">Follow</button>
		<p v-if="metadata?.about" class="about-content">{{ metadata.about }}</p>
		<nav class="tabs">
			<ul>
				<li>
					<RouterLink :to="'/user/' + pubkey">Notes</RouterLink>
				</li>
				<li>
					<RouterLink :to="'/user/' + pubkey + '/info'">Info</RouterLink>
				</li>
				<li>
					<RouterLink :to="'/user/' + pubkey + '/relays'">Relays</RouterLink>
				</li>
			</ul>
		</nav>
		<RouterView :pubkey="pubkeyNormal" :metadata="metadata" />
	</template>
	`
}
