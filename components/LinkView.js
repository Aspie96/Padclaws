function shortUrl(url) {
	if(url.length < 70) {
		return url;
	}
	const index = url.indexOf("://");
	const protocol = url.substring(0, index + 3);
	const resource = url.substring(index + 3);
	const parts = resource.split("/");
	var domain = parts[0];
	if(domain.length > 50) {
		const subDomains = domain.split(".");
		domain = "";
		while(domain.length < 30 && subDomains.length) {
			domain = subDomains.pop() + "." + domain;
		}
		domain = domain.substring(0, domain.length - 1);
		if(subDomains.length > 0) {
			domain = "\u2026." + domain;
		}
	}
	if(parts.length == 1) {
		return url;
	}
	var page = parts[parts.length - 1];
	if(parts.length > 2) {
		page = "\u2026/" + page;
		if(page.length == 2) {
			page = parts[parts.length - 2] + "/";
		}
	}
	if(page.length > 40) {
		page = "\u2026" + page.substring(page.length - 20);
	}
	return protocol + domain + "/" + page;
}

export default {
	props: { url: String },

	computed: {
		fullUrl() {
			if(!this.url.match(/^[a-zA-Z]+:\/\//)) {
				return new URL("http://" + this.url).href;
			}
			return this.url;
		},

		short() {
			return shortUrl(this.fullUrl);
		}
	},

	template: `
	<a :href="fullUrl" rel="ugc" :title="short != url ? url : null">{{ short }}</a>
	`
}
