import AlertView from "../AlertView.js"
import FeedView from "../FeedView.js"
import NoteView from "../NoteView.js"

export default {
	data() {
		return {
			loading: false,
			invalid: false,
			event: null,
			reply: false,
			branch: []
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
			if(!nostrUtils.isHashPrefix(eventId, 32)) {
				this.invalid = true;
				return;
			}
			this.invalid = false;
			this.loading = true;
			this.event = null;
			this.event = await nostrClient.getEventById(this.$route.params.id);
			this.loading = false;
			var eTags = nostrUtils.parseETags(this.event);
			this.branch = [];
			this.reply = !!eTags.reply;
			if(eTags.reply) {
				var parent = eTags.reply;
				var loop = true;
				while(loop) {
					if(parent != eventId && !this.branch.some(e => e.id == parent)) {
						parent = await nostrClient.getEventById(eTags.reply);
						eTags = nostrUtils.parseETags(parent);
						this.branch.unshift(parent);
						parent = eTags.reply;
						loop = !!parent;
					} else {
						loop = false;
					}
				}
			}
		}
	},

	components: {
		AlertView,
		FeedView,
		NoteView
	},

	template:`
	<FeedView v-if="reply" :events="branch" isParent />
	<AlertView v-if="invalid" color="red" icon="alert-triangle">Invalid event ID. Check the URL.</AlertView>
	<NoteView v-else :loading="loading" :event="event" isActive />
	`
}
