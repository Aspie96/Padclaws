import FeedLoaderView from "../FeedLoaderView.js"
import Session from "../../js/session.js"


export default {
	data() {
		return {
			filters: null
		};
	},

	created() {
		this.$watch(
			() => Session.following,
			this.fetchData,
			{
				immediate: !Session.refreshingFollowing,
				deep: true
			}
		);
	},

	methods: {
		fetchData() {
			const authors = [...Session.following];
			if(Session.logged && !Session.following.has(Session.userKeys.public)) {
				authors.push(Session.userKeys.public)
			}
			this.filters = {
				authors,
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
