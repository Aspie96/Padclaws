import UsersCache from "../UsersCache.js"

export default {
	data() {
		return {
			pubkey: null
		};
	},

	created() {
		this.$watch(
			() => this.$route.params,
			this.fetchData,
			{ immediate: true }
		);
	},

	computed: {
		metadata() {
			return UsersCache.users[this.pubkey]?.data;
		}
	},

	methods: {
		fetchData() {
			this.pubkey = this.$route.params.pubkey;
			UsersCache.fetchMetadata(this.pubkey);
		}
	},

	template:`
	<h2>{{ metadata?.name }}</h2>
	<nav class="tabs">
		<ul>
			<li>
				<RouterLink :to="'/user/' + pubkey">Notes</RouterLink>
			</li>
			<li>
				<RouterLink :to="'/user/' + pubkey + '/info'">Info</RouterLink>
			</li>
		</ul>
	</nav>
	<RouterView :pubkey="pubkey" :metadata="metadata" />
	`
}
