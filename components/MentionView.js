import Session from "../js/session.js"
import UsersCache from "./UsersCache.js"

export default {
	props: { pubkey: String },

	data() {
		if(nostrUtils.isHash(this.pubkey, 32)) {
			return {
				valid: true,
				mentionData: null
			};
		}
		return {
			valid: false,
			mentionData: null
		};
	},

	computed: {
		selfUser() {
			return Session.logged && Session.userKeys.public == this.pubkey;
		}
	},

	created() {
		this.$watch(
			() => this.pubkey,
			this.fetchData,
			{ immediate: true }
		);
	},

	methods: {
		fetchData() {
			if(this.pubkey) {
				UsersCache.fetchMetadata(this.pubkey);
				this.mentionData = UsersCache.users[this.pubkey];
			}
		}
	},

	template: `
	<template v-if="valid">
		<RouterLink v-if="mentionData?.metadata?.name" :to="{ name: 'user', params: { pubkey } }" class="mention" :class="{ 'mention-self': selfUser }"><span class="ti ti-at"></span>{{ mentionData.metadata.name }}</RouterLink>
		<RouterLink v-else :to="{ name: 'user', params: { pubkey } }" class="mention" :class="{ 'mention-self': selfUser }"><span class="ti ti-at"></span><span class="mention-pubkey">{{ pubkey }}</span></RouterLink>
	</template>
	<template v-else>{{ pubkey }}</template>
	`
}
