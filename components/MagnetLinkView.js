function shortUri(uri) {
	if(uri.length < 140) {
		return uri;
	}
	return uri.substr(0, 70) + "...";
}

export default {
	props: { uri: String },

	computed: {
		short() {
			return shortUri(this.uri);
		}
	},

	template: `
	<a :href="uri" rel="ugc" :title="short != uri ? uri : null" class="magnet-link"><span class="ti ti-magnet"></span> {{ short }}</a>
	`
}
