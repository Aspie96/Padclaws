import FeedLoaderView from "../FeedLoaderView.js"

export default {
	data() {
		return {
			showReplies: true
		};
	},

	computed: {
		filters() {
			const tag = this.$route.params.tag;
			const tags = [tag];
			const normTag = tag.normalize("NFKC").toLowerCase();
			if(normTag != tag) {
				tags.push(normTag);
			}
			return  {
				kinds: [nostrEventKinds.text_note],
				"#t": tags
			};
		}
	},

	methods: {
		postFilter(event) {
			if(this.showReplies) {
				return true;
			}
			const eTags = nostrUtils.parseETags(event);
			return !eTags.reply;
		}
	},

	components: {
		FeedLoaderView
	},

	template:`
	<form class="form-show-replies">
		<label><input type="checkbox" v-model="showReplies" checked /> Show replies</label>
	</form>
	<FeedLoaderView :filters="filters" :post-filter="postFilter" />
	`
}
