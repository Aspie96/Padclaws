import FeedLoaderView from "../FeedLoaderView.js"
import Session from "../../js/session.js"


export default {
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
		async fetchData() { }
	},

	computed: {
		filters() {
			const authors = [...Session.following];
			if(Session.logged && !Session.following.has(Session.userKeys.public)) {
				authors.push(Session.userKeys.public)
			}
			const filters = {
				authors,
				kinds: [nostrEventKinds.text_note]
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
