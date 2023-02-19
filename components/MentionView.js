export default {
	props: {
		event: Object,
		mention: String
	},

	data() {
		var index = mention.substring(2, mention.length - 1);
		index = parseInt(index);
		const pTags = nostrUtils.getTagValues("p");
		if(index < pTags.length) {
			return {
				valid: true,
				user: pTags[index][1]
			};
		}
		return {
			valid: false,
			user: null
		};
	},

	template: `
	<router-link v-if="valid" :to="'/feed/' + user">{{ user }}</router-link>
	<template v-else>mention</template>
	`
}
