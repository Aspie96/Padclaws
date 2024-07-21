import MentionView from "./MentionView.js"

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

	components: { MentionView },

	template: `
	<MentionView v-if="valid" :pubkey="pubkey" />
	<template v-else>{{ text }}</template>
	`
}
