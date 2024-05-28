import FeedLoaderView from "../FeedLoaderView.js"
import Session from "../../js/session.js"


export default {
	data() {
		return {
			filters: {
				kinds: [nostrEventKinds.text_note],
				"#p": [Session.userKeys.public]
			}
		};
	},

	components: {
		FeedLoaderView
	},

	template:`
	<FeedLoaderView :filters="filters" />
	`
}
