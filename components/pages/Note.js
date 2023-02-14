import NoteView from "../NoteView.js"

export default {
	data() {
		return {
			loading: false,
			invalid: false,
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
			const eventId = this.$route.params.id;
			if(!nostrUtils.isHash(eventId, 32)) {
				this.invalid = true;
				return;
			}
			this.invalid = false;
			this.loading = true;
			this.note = null;
			const event = await nostrClient.getEventById(this.$route.params.id);
			this.loading = false;
			this.note =  {
				id: event.id,
				author: nostrUtils.getAuthor(event),
				content: event.content,
				date: nostrUtils.getDate(event)
			};
		}
	},

	components: {
		NoteView
	},

	template:`
	<p v-if="invalid" class="alert alert-red">
		<span class="ti ti-alert-triangle"></span>
		<span class="alert-text">Invalid event ID. Check the URL.</span>
	</p>
	<note-view v-else :loading="loading" :note="note" />
	`
}
