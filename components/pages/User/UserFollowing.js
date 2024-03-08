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
			noEvents: false,
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
			this.noEvents = false;
			const filters = {
				authors: [this.pubkey],
				kinds: [nostrEventKinds.contact_list],
				limit: 1
			};
			const event = await nostrClient.fetchMostRecent(filters);
			this.loading = false;
			if(!event) {
				this.noEvents = true;
				return;
			}
			const tags = nostrUtils.getTagValues(event, "p");
			console.log(Session.following);
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
			UsersCache.fetchMultipleMetadata(this.following);
		}
	},

	components: {
		AlertView,
		UserBoxView
	},

	template:`
	<AlertView v-if="loading" color="blue" icon="hourglass">Loading&hellip;</AlertView>
	<AlertView v-else-if="following.length == 0" color="blue" icon="mood-empty">No following user found.</AlertView>
	<template v-else>
		<p>Following: {{ following.length }}</p>
		<UserBoxView v-for="pubkey in following" :pubkey="pubkey" />
	</template>
	`
}
