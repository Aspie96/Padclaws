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

	created() {
		this.$watch(
			() => this.event,
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
		<router-link v-if="mentionData?.metadata?.name" :to="'/user/' + pubkey" class="mention"><span class="ti ti-at"></span>{{ mentionData.metadata.name  }}</router-link>
		<router-link v-else :to="'/user/' + pubkey" class="mention"><span class="ti ti-at"></span><span class="mention-pubkey">{{ pubkey }}</span></router-link>
	</template>
	<template v-else>{{ mention }}</template>
	`
}
