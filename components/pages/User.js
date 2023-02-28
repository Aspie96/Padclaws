import AlertView from "../AlertView.js"
import UsersCache from "../UsersCache.js"

export default {
	data() {
		return {
			invalid: false,
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
			return UsersCache.users[this.pubkey]?.metadata;
		},

		pubkeyNormal() {
			return UsersCache.users[this.pubkey]?.pubkey || this.pubkey;
		}
	},

	methods: {
		fetchData() {
			this.invalid = false;
			this.pubkey = this.$route.params.pubkey;
			if(!nostrUtils.isHashPrefix(this.pubkey, 32)) {
				const decoded = nostrUtils.decodeEntity(this.pubkey);
				if(decoded && decoded.prefix == nostrEncEntityPrefixes.npub && nostrUtils.isHash(decoded.hex, 32)) {
					this.$router.replace({
						name: this.$route.matched[this.$route.matched.length - 1].name,
						params: {
							pubkey: decoded.hex
						}
					});
				} else {
					this.invalid = true;
				}
				return;
			}
			UsersCache.fetchMetadata(this.pubkey);
		}
	},

	components: {
		AlertView
	},

	template:`
	<AlertView v-if="invalid" color="red" icon="alert-triangle">Invalid public key. Check the URL.</AlertView>
	<template v-else>
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
		<RouterView :pubkey="pubkeyNormal" :metadata="metadata" />
	</template>
	`
}
