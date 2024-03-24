import MentionView from "./MentionView.js"

export default {
	props: { text: String },

	data() {
		var body;
		if(this.text.startsWith("nostr:")) {
			body = this.text.substr("nostr:".length);
		} else {
			body = this.text;
		}
		const entity = nostrUtils.decodeEntity(body);
		switch(entity.prefix) {
			case nostrEncEntityPrefixes.npub:
			case nostrEncEntityPrefixes.nprofile:
				if(!nostrUtils.isHash(entity.hex, 32)) {
					return { valid: false };
				}
				return {
					valid: true,
					type: "mention",
					pubkey: entity.hex
				};
			case nostrEncEntityPrefixes.note:
			case nostrEncEntityPrefixes.nevent:
				if(!nostrUtils.isHash(entity.hex, 32)) {
					return { valid: false };
				}
				return {
					valid: true,
					type: "reference",
					referencedId: entity.hex
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
	<template v-if="!valid">{{ text }}</template>
	<MentionView v-else-if="type == 'mention'" :pubkey="pubkey" />
	<RouterLink v-else-if="type == 'reference'" class="note-id" :to="{ name: 'note', params: { id: referencedId } }" :title="referencedId"><span class="ti ti-notes"></span>{{ referencedId }}</RouterLink>
	`
}
