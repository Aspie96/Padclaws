import NoteView from "../NoteView.js"

export default {
	data() {
		return {
			loading: false,
			note: null
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
		async fetchData() {
			this.loading = true;
			this.note = null;
			const event = await nostrClient.getEventById(this.$route.params.id);
			this.loading = false;
			this.note =  {
				author: nostrUtils.getAuthor(event),
				content: event.content
			};
		}
	},

	components: {
		NoteView
	},

	template:`
	<note-view :loading="loading" :note="note" />
	`
}
