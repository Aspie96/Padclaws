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
			this.fetchData,
			{ immediate: true }
		);
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
			const filters = {
				ids: [this.$route.params.id],
				limit: 1
			};
			this.event = await nostrClient.fetchOne(filters);
			this.loading = false;
			var eTags = nostrUtils.parseETags(this.event);
			this.branch = [];
			this.reply = !!eTags.reply;
			if(eTags.reply) {
				var parent = eTags.reply;
				var loop = true;
				while(loop) {
					if(parent != eventId && !this.branch.some(e => e.id == parent)) {
						const filters = {
							ids: [eTags.reply],
							limit: 1
						};
						parent = await nostrClient.fetchOne(filters);
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
