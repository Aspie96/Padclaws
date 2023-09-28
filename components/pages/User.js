import AlertView from "../AlertView.js"
import Session from "../../js/session.js"
import TextView from "../TextView.js"
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
			() => this.$route.params.pubkey,
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

		userLogged() {
			return Session.logged;
		},

		selfUser() {
			return Session.logged && Session.userKeys.public.startsWith(this.pubkey);
		},

		followed() {
			return Session.followedUsers.has(this.pubkey);
		},

		pubkeyValid() {
			return nostrUtils.isHashPrefix(this.pubkey, 32);
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
			if(!this.pubkeyValid) {
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
		AlertView,
		TextView
	},

	template:`
	<AlertView v-if="noRelays" color="yellow" icon="alert-triangle">
		<p>No relays set.</p>
		<p>Before fetching data, you must add some <RouterLink :to="{ name: 'settings-relays' }">relays</RouterLink>.</p>
	</AlertView>
	<AlertView v-else-if="invalid" color="red" icon="alert-triangle">Invalid public key. Check the URL.</AlertView>
	<template v-else>
		<h1>{{ metadata?.name }}</h1>
		<RouterLink v-if="selfUser" :to="{ name: 'settings-profile' }" class="user-page-btn user-page-btn-right"><span class="ti ti-pencil"></span>Edit profile</RouterLink>
		<template v-else-if="userLogged">
			<button v-if="followed" type="button" class="user-page-btn user-page-btn-right" @click="unfollow"><span class="ti ti-social-off"></span>Unfollow</button>
			<button v-else type="button" class="user-page-btn user-page-btn-right" @click="follow"><span class="ti ti-social"></span>Follow</button>
		</template>
		<p v-if="metadata?.about" class="about-content">
			<TextView :text="metadata.about" />
		</p>
		<nav class="tabs">
			<ul>
				<li>
					<RouterLink :to="{ name: 'user', params: { pubkey } }">Notes</RouterLink>
				</li>
				<li>
					<RouterLink :to="{ name: 'user-info', params: { pubkey } }">Info</RouterLink>
				</li>
				<li>
					<RouterLink :to="{ name: 'user-relays', params: { pubkey } }">Relays</RouterLink>
				</li>
				<li>
					<RouterLink :to="{ name: 'user-following', params: { pubkey } }">Following</RouterLink>
				</li>
			</ul>
		</nav>
		<RouterView v-if="pubkeyValid" :pubkey="pubkeyNormal" :metadata="metadata" />
	</template>
	`
}
