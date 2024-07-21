import FeedLoaderView from "../FeedLoaderView.js"
import Session from "../../js/session.js"

export default {
	data() {
		return {
			filters: {
				kinds: [nostrEventKinds.text_note, nostrEventKinds.repost],
				"#p": [Session.userKeys.public]
			}
		};
	},

	beforeUnmount() {
		this.$refs.feedLoaderView.storeData();
	},

	methods: {
		postFilter(event) {
			return event.pubkey != Session.userKeys.public;
		}
	},

	components: {
		FeedLoaderView
	},

	template:`
	<FeedLoaderView ref="feedLoaderView" :filters="filters" :post-filter="postFilter" fetch-new store-key="notifications/feedLoaderView" />
	`
}
