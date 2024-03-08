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
			followers: []
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
		if(this.subId) {
			nostrClient.cancelSubscription(this.subId);
			this.subId = null;
		}
		if(this.interval) {
			clearInterval(this.interval);
			this.interval = null;
		}
	},

	methods: {
		async fetchData() {
			this.loading = true;
			var trustedFollowers = new Set();
			var filters = {
				authors: [this.pubkey],
				kinds: [nostrEventKinds.contact_list],
				limit: 1
			};
			const event = await nostrClient.fetchMostRecent(filters);
			const tags = nostrUtils.getTagValues(event, "p");
			for(const tag of tags) {
				const contactPubkey = tag[1];
				trustedFollowers.add(contactPubkey);
			}
			for(const user of Session.following) {
				trustedFollowers.add(user);
			}
			this.loading = false;

			console.log(Session.following);
			if(Session.following.has(this.pubkey)) {
				this.followers.push(Session.userKeys.public);
			}
			filters = {
				authors: [...trustedFollowers],
				kinds: [nostrEventKinds.contact_list],
				"#p": [this.pubkey]
			};
			const newFollowers = [];
			this.subId = nostrClient.fetchFeed(filters, event => {
				const follower = nostrUtils.getAuthor(event);
				if(follower != this.pubkey) {
					if(!this.followers.includes(follower) && !newFollowers.includes(follower)) {
						newFollowers.push(follower);
					}
				}
			});
			var noNewFollower = false;
			this.interval = setInterval(() => {
				if(newFollowers.length > 0) {
					this.followers.push(...newFollowers);
					UsersCache.fetchMultipleMetadata(newFollowers);
					newFollowers.length = 0;
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
	`
}
