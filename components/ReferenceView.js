export default {
	props: {
		event: Object,
		text: String
	},

	data() {
		const reference = this.text.substr("nostr:".length);
		const entity = nostrUtils.decodeEntity(reference);
		if(entity.prefix == nostrEncEntityPrefixes.note && nostrUtils.isHash(entity.hex, 32)) {
			return {
				valid: true,
				referenceId: entity.hex
			};
		}
		return {
			valid: false,
			referenceId: null
		};
	},

	template: `
	<RouterLink v-if="valid" class="note-id" :to="{ name: 'note', params: { id: referenceId } }">{{ referenceId }}</RouterLink>
	<template v-else>{{ text }}</template>
	`
}
