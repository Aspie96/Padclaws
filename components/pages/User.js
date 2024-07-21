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
			followBtnDisabled: false
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

		refreshingFollowing() {
			return Session.logged && Session.refreshingFollowing;
		},

		selfUser() {
			return Session.logged && Session.userKeys.public.startsWith(this.pubkey);
		},

		followed() {
			return Session.following.has(this.pubkey);
		},

		pubkeyValid() {
			return nostrUtils.isHashPrefix(this.pubkey, 32);
		}
	},

	methods: {
		fetchData() {
			this.invalid = false;
			this.pubkey = this.$route.params.pubkey;
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
				document.title = this.metadata?.name || this.metadata?.display_name || DEFAULT_TITLE;
			});
		},

		async follow() {
			console.log("follow");
			this.followBtnDisabled = true;
			await Session.followUser(this.pubkey);
			this.followBtnDisabled = false;
		},

		async unfollow() {
			this.followBtnDisabled = true;
			await Session.unfollowUser(this.pubkey);
			this.followBtnDisabled = false;
		}
	},

	components: {
		AlertView,
		TextView
	},

	template:`
	<AlertView v-if="invalid" color="red" icon="alert-triangle">Invalid public key. Check the URL.</AlertView>
	<template v-else>
		<h1>{{ metadata?.name || metadata?.display_name }}</h1>
		<p v-if="metadata?.name && metadata?.display_name && metadata.display_name != metadata.name" class="display-name">{{ metadata.display_name }}</p>
		<RouterLink v-if="selfUser" :to="{ name: 'settings-profile' }" class="user-page-btn user-page-btn-right"><span class="ti ti-pencil"></span>Edit profile</RouterLink>
		<template v-else-if="userLogged">
			<button v-if="followed" type="button" class="user-page-btn user-page-btn-negative user-page-btn-right" @click="unfollow" :disabled="followBtnDisabled"><span class="ti ti-social-off"></span>Unfollow</button>
			<button v-else type="button" class="user-page-btn user-page-btn-right" @click="follow" :disabled="followBtnDisabled || refreshingFollowing"><span class="ti ti-social"></span>Follow</button>
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
				<li>
					<RouterLink :to="{ name: 'user-followers', params: { pubkey } }">Followers</RouterLink>
				</li>
			</ul>
		</nav>
		<RouterView v-if="pubkeyValid" :pubkey="pubkeyNormal" :metadata="metadata" />
	</template>
	`
}
