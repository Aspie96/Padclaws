import Session from "../js/session.js"
import UsersCache from "./UsersCache.js"

export default {
	props: {
		event: Object,
		mention: String
	},

	data() {
		var index = this.mention.substring(2, this.mention.length - 1);
		index = parseInt(index);
		const tags = this.event.tags;
		if(index < tags.length && tags[index][0] == "p") {
			return {
				valid: true,
				pubkey: tags[index][1],
				mentionData: null
			};
		}
		return {
			valid: false,
			pubkey: null,
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
			() => this.event,
			this.fetchData,
			{ immediate: true }
		);
	},

	methods: {
		fetchData() {
			if(this.event.pubkey) {
				UsersCache.fetchMetadata(this.pubkey);
				this.mentionData = UsersCache.users[this.pubkey];
			}
		}
	},

	template: `
	<template v-if="valid">
		<RouterLink v-if="mentionData?.metadata?.name" :to="{ name: 'user', params: { pubkey } }" class="mention" :class="{ 'mention-self': selfUser }"><span class="ti ti-at"></span>{{ mentionData.metadata.name  }}</RouterLink>
		<RouterLink v-else :to="{ name: 'user', params: { pubkey } }" class="mention" :class="{ 'mention-self': selfUser }"><span class="ti ti-at"></span><span class="mention-pubkey">{{ pubkey }}</span></RouterLink>
	</template>
	<template v-else>{{ mention }}</template>
	`
}
