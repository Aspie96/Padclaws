export default {
	props: {
		event: Object,
		mention: String
	},

	data() {
		var index = this.mention.substring(2, this.mention.length - 1);
		index = parseInt(index);
		const tags = this.event.tags;
		if(index <= tags.length && tags[index][0] == "p") {
			return {
				valid: true,
				user: tags[index][1]
			};
		}
		return {
			valid: false,
			user: null
		};
	},

	template: `
	<router-link v-if="valid" :to="'/feed/' + user">@<span class="mention">{{ user }}</span></router-link>
	<template v-else>{{ mention }}</template>
	`
}
