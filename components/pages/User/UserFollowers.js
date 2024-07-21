import AlertView from "../../AlertView.js"
import Session from "../../../js/session.js"
import UsersCache from "../../UsersCache.js"
import UserBoxView from "../../UserBoxView.js"

export default {
	props: {
		pubkey: String,
		metadata: Object
	},

	data() {
		return {
			loading: false,
			followers: [],
			loadMoreBtn: false
		};
	},

	created() {
		this.$watch(
			() => this.pubkey,
			this.fetchData,
			{ immediate: true }
		);
	},

	unmounted() {
		for(const subId of this.subIds) {
			nostrClient.cancelSubscription(subId);
		}
		if(this.interval) {
			clearInterval(this.interval);
			this.interval = null;
		}
	},

	methods: {
		async fetchData() {
			if(this.subIds) {
				for(const subId of this.subIds) {
					nostrClient.cancelSubscription(subId);
				}
			}
			this.subIds = [];
			this.loading = true;
			this.loadMoreBtn = false;
			var trustedFollowers = new Set();
			if(Session.logged) {
				if(Session.refreshingFollowing) {
					await new Promise(resolve => {
						Vue.watch(() => Session.refreshingFollowing, resolve, { once: true });
					});
				}
				for(const user of Session.following.keys()) {
					trustedFollowers.add(user);
				}
				if(Session.following.has(this.pubkey) && Session.userKeys.public != this.pubkey) {
					this.followers.push(Session.userKeys.public);
				}
			}
			if(!Session.logged || Session.userKeys.public != this.pubkey) {
				var filters = {
					authors: [this.pubkey],
					kinds: [nostrEventKinds.follows],
					limit: 1
				};
				const event = await nostrClient.fetchMostRecent(filters);
				const tags = nostrUtils.getTagValues(event, "p");
				for(const tag of tags) {
					const contactPubkey = tag[1];
					trustedFollowers.add(contactPubkey);
				}
			}
			trustedFollowers.delete(this.pubkey);
			this.loading = false;
			filters = {
				authors: [...trustedFollowers],
				kinds: [nostrEventKinds.follows],
				"#p": [this.pubkey]
			};
			const newFollowers = [];
			const timestamps = {};
			const subId = nostrClient.fetchFeed(filters, event => {
				const follower = nostrUtils.getAuthor(event);
				if(!this.followers.includes(follower) && !newFollowers.includes(follower)) {
					newFollowers.push(follower);
					timestamps[follower] = event.created_at;
				} else if(event.created_at > timestamps[follower]) {
					timestamps[follower] = event.created_at;
				}
			});
			this.subIds.push(subId);
			var noNewFollower = false;
			this.interval = setInterval(() => {
				if(newFollowers.length > 0) {
					this.followers.push(...newFollowers);
					UsersCache.fetchMultipleMetadata(newFollowers);
					newFollowers.length = 0;
					noNewFollower = false;
				} else if(noNewFollower) {
					clearInterval(this.interval);
					this.interval = null;
					this.loadMoreBtn = true;
				} else {
					noNewFollower = true;
				}
			}, 500);
		},

		loadMore() {
			this.loadMoreBtn = false;
			const filters = {
				kinds: [nostrEventKinds.follows],
				"#p": [this.pubkey]
			};
			const newFollowers = [];
			const timestamps = {};
			const subId = nostrClient.fetchFeed(filters, event => {
				const follower = nostrUtils.getAuthor(event);
				if(follower != this.pubkey) {
					if(!this.followers.includes(follower) && !newFollowers.includes(follower)) {
						newFollowers.push(follower);
						timestamps[follower] = event.created_at;
					} else if(event.created_at > timestamps[follower]) {
						timestamps[follower] = event.created_at;
					}
				}
			});
			this.subIds.push(subId);
			var noNewFollower = false;
			this.interval = setInterval(() => {
				if(newFollowers.length > 0) {
					this.followers.push(...newFollowers);
					UsersCache.fetchMultipleMetadata(newFollowers);
					newFollowers.length = 0;
					noNewFollower = false;
				} else if(noNewFollower) {
					clearInterval(this.interval);
					this.interval = null;
				} else {
					noNewFollower = true;
				}
			}, 500);
		}
	},

	components: {
		AlertView,
		UserBoxView
	},

	template:`
	<AlertView v-if="loading" color="blue" icon="hourglass">Loading&hellip;</AlertView>
	<template v-else>
		<UserBoxView v-for="pubkey in followers" :pubkey="pubkey" />
	</template>
	<button v-if="loadMoreBtn" type="button" class="load-more-btn" @click="loadMore">
		<span class="ti ti-chevrons-down"></span>
		<template v-if="followers.length">Other followers&hellip;</template>
		<template v-else="followers.length">Load followers&hellip;</template>
		<span class="ti ti-chevrons-down"></span>
	</button>
	`
}
