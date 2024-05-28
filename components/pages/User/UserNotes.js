import FeedLoaderView from "../../FeedLoaderView.js"

export default {
	props: {
		pubkey: String,
		metadata: Object
	},

	computed: {
		filters() {
			return {
				authors: [this.pubkey],
				kinds: [nostrEventKinds.text_note]
			};
		}
	},

	components: {
		FeedLoaderView
	},

	template:`
	<FeedLoaderView :filters="filters" />
	`
}
