import AlertView from "../AlertView.js"
import FeedLoaderView from "../FeedLoaderView.js"
import Session from "../../js/session.js"
import HistoryStore from "../../js/historyStore.js"

var showReplies = true;

export default {
	data() {
		return {
			filters: null,
			showReplies
		};
	},

	mounted() {
		const data = HistoryStore.getData("feed");
		if(data) {
			showReplies = data.showReplies;
			this.showReplies = showReplies;
		}
		this.$watch(
			() => Session.following.keys(),
			this.fetchData,
			{
				immediate: !Session.refreshingFollowing,
				deep: true
			}
		);
	},

	beforeUnmount() {
		this.$refs.feedLoaderView.storeData();
		HistoryStore.storeData("feed", {
			showReplies: this.showReplies
		});
	},

	beforeRouteLeave(to, from) {
		/*const data = crypto.randomUUID();
		console.log(history.state);
		HistoryStore.storeData(data);*/
	},

	methods: {
		fetchData() {
			/*console.log(HistoryStore.getData());*/
			const authors = [...Session.following.keys()];
			if(Session.logged && !Session.following.has(Session.userKeys.public)) {
				authors.push(Session.userKeys.public)
			}
			this.filters = {
				authors,
				kinds: [nostrEventKinds.text_note, nostrEventKinds.repost]
			};
		},

		postFilter(event) {
			if(this.showReplies || event.kind == nostrEventKinds.repost) {
				return true;
			}
			const refs = nostrUtils.parseEQTags(event);
			return !refs.reply;
		}
	},

	components: {
		AlertView,
		FeedLoaderView
	},

	template:`
	<form class="form-show-replies">
		<label><input type="checkbox" v-model="showReplies" checked /> Show replies</label>
	</form>
	<FeedLoaderView ref="feedLoaderView" v-if="filters" :filters="filters" :post-filter="postFilter" fetch-new store-key="feed/feedLoaderView" />
	<AlertView v-else color="blue" icon="hourglass">Loading&hellip;</AlertView>
	`
}
