import NoteView from "../NoteView.js"
import AlertView from "../AlertView.js"

export default {
	data() {
		return {
			loading: false,
			invalid: false,
			event: null
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
			this.event = null;
			this.event = await nostrClient.getEventById(this.$route.params.id);
			this.loading = false;
		}
	},

	components: {
		NoteView,
		AlertView
	},

	template:`
	<AlertView v-if="invalid" color="red" icon="alert-triangle">Invalid event ID. Check the URL.</AlertView>
	<NoteView v-else :loading="loading" :event="event" />
	`
}
