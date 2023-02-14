import FeedView from "../FeedView.js"

export default {
	data() {
		return {
			invalid: false,
			notes: []
		};
	},

	created() {
		this.$watch(
			() => this.$route.params,
			() => {
			this.fetchData()
			},
			{ immediate: true }
		);
	},

	methods: {
		fetchData() {
			this.notes = [];
			const authorId = this.$route.params.id;
			if(!nostrUtils.isHash(authorId, 32)) {
				this.invalid = true;
				return;
			}
			this.invalid = false;
			nostrClient.getFeed(event => {
				const note = {
					id: event.id,
					author: nostrUtils.getAuthor(event),
					content: event.content,
					date: nostrUtils.getDate(event)
				};
				var index = 0;
				while(index < this.notes.length && this.notes[index].date > note.date) {
					index++;
				}
				this.notes.splice(index, 0, note);
			}, authorId);
		}
	},

	components: {
		FeedView
	},

	template:`
	<p v-if="invalid" class="alert alert-red">
		<span class="ti ti-alert-triangle"></span>
		<span class="alert-text">Invalid public key. Check the URL.</span>
	</p>
	<feed-view v-else :notes="notes" />
	`
}
