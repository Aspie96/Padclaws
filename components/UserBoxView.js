import Session from "../js/session.js"
import UsersCache from "./UsersCache.js"
import Variables from "../js/variables.js"

export default {
	props: {
		pubkey: String,
		hover: Boolean
	},

	data() {
		return {
			followBtnDisabled: false
		};
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

		myKey() {
			return Session.logged && Session.userKeys.public;
		},

		username() {
			return UsersCache.users[this.pubkey]?.metadata?.name || UsersCache.users[this.pubkey]?.metadata?.display_name;
		},

		about() {
			return UsersCache.users[this.pubkey]?.metadata?.about;
		},

		following() {
			if(!Session.logged) {
				return false;
			}
			return Session.following.has(this.pubkey);
		},

		logged() {
			return Session.logged;
		},

		style() {
			return {
				top: Variables.hoverCardTop + "px",
				left: Variables.hoverCardLeft + "px"
			};
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

		async follow() {
			this.followBtnDisabled = true;
			await Session.followUser(this.pubkey);
			this.followBtnDisabled = false;
		},

		async unfollow() {
			this.followBtnDisabled = true;
			await Session.unfollowUser(this.pubkey);
			this.followBtnDisabled = false;
		},

		mouseover() {
			Variables.displayed = true;
		},

		mouseleave() {
			Variables.displayed = false;
			setTimeout(() => {
				if(!Variables.displayed) {
					Variables.hoverCard = null;
				}
			}, 0);
		}
	},

	template: `
	<div class="user-box" :class="{ hover }" :style="style" @mouseover="mouseover" @mouseleave="mouseleave">
		<div class="user-data">
			<RouterLink v-if="username" class="username" :title="pubkey" :to="{ name: 'user', params: { pubkey } }">{{ username }}</RouterLink>
			<RouterLink class="user-pubkey" :title="pubkey" :to="{ name: 'user', params: { pubkey } }">{{ pubkey }}</RouterLink>
		</div>
		<p class="about">{{ about }}</p>
		<template v-if="logged && pubkey != myKey">
			<button v-if="following" type="button" class="user-page-btn user-page-btn-negative user-page-btn-right" @click="unfollow" :disabled="followBtnDisabled"><span class="ti ti-social-off"></span>Unfollow</button>
			<button v-else type="button" class="user-page-btn user-page-btn-right" @click="follow"><span class="ti ti-social" :disabled="followBtnDisabled"></span>Follow</button>
		</template>
	</div>
	`
}
