import AlertView from "../../AlertView.js"
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

	methods: {
		async fetchData() {
			this.loading = true;
			const following = [];
			var filters = {
				authors: [this.pubkey],
				kinds: [nostrEventKinds.contact_list],
				limit: 1
			};
			const event = await nostrClient.fetchMostRecent(filters);
			const tags = nostrUtils.getTagValues(event, "p");
			for(const tag of tags) {
				const contactPubkey = tag[1];
				if(!following.includes(contactPubkey) && contactPubkey != this.pubkey) {
					following.push(contactPubkey);
				}
			}
			UsersCache.fetchMultipleMetadata(following);
			this.loading = false;

			filters = {
				kinds: [nostrEventKinds.contact_list],
				"#p": [this.pubkey]
			};

			// Fetch followers too
			for(const user of following) {
				this.trustedUsers.add(user)
			}
			for(const user of Session.followedUsers) {
				this.trustedUsers.add(user)
			}
		}
	},

	components: {
		AlertView,
		UserBoxView
	},

	template:`
	<AlertView v-if="loading" color="blue" icon="hourglass">Loading&hellip;</AlertView>
	<template v-else>
		<p>Following: {{ following.length }}</p>
		<UserBoxView v-for="pubkey in following" :pubkey="pubkey" />
	</template>
	`
}
