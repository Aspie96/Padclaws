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
			following: []
		};
	},

	created() {
		this.$watch(
			() => this.pubkey,
			this.fetchData,
			{ immediate: true }
		);
	},

	methods: {
		async fetchData() {
			this.loading = true;
			this.following = [];
			if(Session.logged && this.pubkey == Session.userKeys.public) {
				if(Session.refreshingFollowing) {
					await new Promise(resolve => {
						Vue.watch(() => Session.refreshingFollowing, resolve, { once: true });
					});
				} else {
					await Session.refreshFollowing();
				}
				for(const user of Session.following.keys()) {
					if(user != Session.userKeys.public) {
						this.following.push(user);
					}
				}
				this.loading = false;
			} else {
				const filters = {
					authors: [this.pubkey],
					kinds: [nostrEventKinds.follows],
					limit: 1
				};
				const event = await nostrClient.fetchMostRecent(filters);
				this.loading = false;
				if(!event) {
					return;
				}
				const tags = nostrUtils.getTagValues(event, "p");
				for(const tag of tags) {
					const contactPubkey = tag[1];
					if(!this.following.includes(contactPubkey) && contactPubkey != this.pubkey) {
						if(contactPubkey == Session.userKeys.public) {
							this.following.unshift(contactPubkey);
						} else {
							this.following.push(contactPubkey);
						}
					}
				}
			}
			UsersCache.fetchMultipleMetadata(this.following);
		}
	},

	components: {
		AlertView,
		UserBoxView
	},

	template:`
	<AlertView v-if="loading" color="blue" icon="hourglass">Loading&hellip;</AlertView>
	<AlertView v-else-if="following.length == 0" color="blue" icon="mood-empty">No followed user found.</AlertView>
	<template v-else>
		<p>Following: {{ following.length }}</p>
		<UserBoxView v-for="pubkey in following" :pubkey="pubkey" />
	</template>
	`
}
