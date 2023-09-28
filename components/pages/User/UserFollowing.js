import AlertView from "../../AlertView.js"
import UsersCache from "../../UsersCache.js"
import UserBoxView from "../../UserBoxView.js"

export default {
	props: {
		pubkey: String,
		metadata: Object
	},

	data() {
		return {
			loading: false,
			following: []
		};
	},

	created() {
		this.$watch(
			() => this.pubkey,
			this.fetchData,
			{ immediate: true }
		);
	},

	methods: {
		async fetchData() {
			this.loading = true;
			this.following = [];
			const filters = {
				authors: [this.pubkey],
				kinds: [nostrEventKinds.contact_list],
				limit: 1
			};
			const event = await nostrClient.fetchMostRecent(filters);
			const tags = nostrUtils.getTagValues(event, "p");
			for(const tag of tags) {
				if(!this.following.includes(tag)) {
					this.following.push(tag[1]);
				}
			}
			UsersCache.fetchMultipleMetadata(this.following);
			this.loading = false;
		}
	},

	components: {
		AlertView,
		UserBoxView
	},

	template:`
	<AlertView v-if="loading" color="blue" icon="hourglass">Loading&hellip;</AlertView>
	<UserBoxView v-for="pubkey in following" :pubkey="pubkey" />
	`
}
