import Session from "../js/session.js"
import UsersCache from "./UsersCache.js"

export default {
	props: {
		event: Object,
		text: String
	},

	data() {
		const mention = this.text.substr("nostr:".length);
		const entity = nostrUtils.decodeEntity(mention);
		if(entity.prefix == nostrEncEntityPrefixes.npub && nostrUtils.isHash(entity.hex, 32)) {
			return {
				valid: true,
				pubkey: entity.hex,
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
	<template v-else>{{ text }}</template>
	`
}
