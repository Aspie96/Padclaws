function shortUrl(url) {
	if(url.length < 30) {
		return url;
	}
	const index = url.indexOf("://");
	const protocol = url.substring(0, index + 3);
	const resource = url.substring(index + 3);
	const parts = resource.split("/");
	if(parts.length <= 2) {
		return url;
	}
	var page = parts[parts.length - 1];
	if(page.length == 0) {
		page = parts[parts.length - 1] + "/";
	}
	return protocol + parts[0] + "/\u2026/" + page;
}

export default {
	props: {
		event: Object,
		url: String
	},

	computed: {
		short() {
			return shortUrl(this.url);
		}
	},

	template: `
	<a :href="url" rel="ugc" :title="short != url ? url : null">{{ short }}</a>
	`
}
