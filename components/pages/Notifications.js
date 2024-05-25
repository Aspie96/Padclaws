import FeedLoaderView from "../FeedLoaderView.js"
import Session from "../../js/session.js"


export default {
	created() {
		this.fetchData();
	},

	methods: {
		async fetchData() { }
	},

	computed: {
		filters() {
			const filters = {
				kinds: [nostrEventKinds.text_note],
				"#p": [Session.userKeys.public]
			};
			return filters;
		}
	},

	components: {
		FeedLoaderView
	},

	template:`
	<FeedLoaderView :filters="filters" />
	`
}
