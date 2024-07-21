import FeedLoaderView from "../../FeedLoaderView.js"
import HistoryStore from "../../../js/historyStore.js";

var showReplies = true;

export default {
	props: {
		pubkey: String,
		metadata: Object
	},

	data() {
		return {
			showReplies: true
		};
	},

	mounted() {
		const data = HistoryStore.getData("userNotes");
		if(data) {
			showReplies = data.showReplies;
			this.showReplies = showReplies;
		}
	},

	beforeUnmount() {
		this.$refs.feedLoaderView.storeData();
		HistoryStore.storeData("userNotes", {
			showReplies: this.showReplies
		});
	},

	methods: {
		postFilter(event) {
			if(this.showReplies || event.kind == nostrEventKinds.repost) {
				return true;
			}
			const refs = nostrUtils.parseEQTags(event);
			return !refs.reply;
		}
	},

	computed: {
		filters() {
			return {
				authors: [this.pubkey],
				kinds: [nostrEventKinds.text_note, nostrEventKinds.repost]
			};
		}
	},

	components: {
		FeedLoaderView
	},

	template:`
	<form class="form-show-replies">
		<label><input type="checkbox" v-model="showReplies" checked /> Show replies</label>
	</form>
	<FeedLoaderView ref="feedLoaderView" :filters="filters" :post-filter="postFilter" fetch-new store-key="userNotes/feedLoaderView" />
	`
}
