import FeedView from "../FeedView.js"

export default {
	data() {
		return {
			invalid: false,
			events: []
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
			this.events = [];
			const authorId = this.$route.params.id;
			if(!nostrUtils.isHash(authorId, 32)) {
				this.invalid = true;
				return;
			}
			this.invalid = false;
			nostrClient.getFeed(event => {
				var index = 0;
				while(index < this.events.length && this.events[index].date > event.date) {
					index++;
				}
				this.events.splice(index, 0, event);
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
	<FeedView v-else :events="events" />
	`
}
