import FeedView from "../FeedView.js"

export default {
	data() {
		return {
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
		)
	},

	methods: {
		fetchData() {
			this.notes = [];
			const event = nostrClient.getFeed(event => {
				const note = {
					author: nostrUtils.getAuthor(event),
					content: event.content,
					date: nostrUtils.getDate(event)
				};
				var index = 0;
				while(index < this.notes.length && nostrUtils.getDate(this.notes[index]) > note.date) {
					index++;
				}
				this.notes.splice(index, 0, note);
			}, this.$route.params.id);
		}
	},

	components: {
		FeedView
	},

	template:`
	<feed-view :notes="notes" />
	`
}
