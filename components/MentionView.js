import Session from "../js/session.js"
import UserBoxView from "./UserBoxView.js";
import UsersCache from "./UsersCache.js"
import Variables from "../js/variables.js"

export default {
	props: { pubkey: String },

	data() {
		if(nostrUtils.isHash(this.pubkey, 32)) {
			return {
				valid: true,
				mentionData: null,
				displayBox: false
			};
		}
		return {
			valid: false,
			mentionData: null,
			displayBox: false
		};
	},

	computed: {
		selfUser() {
			return Session.logged && Session.userKeys.public == this.pubkey;
		}
	},

	created() {
		this.$watch(
			() => this.pubkey,
			this.fetchData,
			{ immediate: true }
		);
	},

	unmounted() {
		Variables.hoverCard = null;
	},

	methods: {
		fetchData() {
			if(this.pubkey) {
				UsersCache.fetchMetadata(this.pubkey);
				this.mentionData = UsersCache.users[this.pubkey];
			}
		},

		mouseover() {
			Variables.hoverCard = this.pubkey;
			const rect = this.$refs.link.$el.getBoundingClientRect();
			Variables.hoverCardTop = rect.bottom + scrollY;
			Variables.hoverCardLeft = rect.left;
			Variables.displayed = true;
		},

		mouseleave() {
			Variables.displayed = false;
			setTimeout(() => {
				if(!Variables.displayed) {
					Variables.hoverCard = null;
				}
			}, 0);
		}
	},

	components: { UserBoxView },

	template: `
	<template v-if="valid">
		<RouterLink ref="link" v-if="mentionData?.metadata?.name || mentionData?.metadata?.display_name" :to="{ name: 'user', params: { pubkey } }" class="mention" :class="{ 'mention-self': selfUser }" @mouseover="mouseover" @mouseleave="mouseleave"><span class="ti ti-at"></span>{{ mentionData.metadata.name || mentionData.metadata.display_name }}</RouterLink>
		<RouterLink ref="link" v-else :to="{ name: 'user', params: { pubkey } }" class="mention" :class="{ 'mention-self': selfUser }"><span class="ti ti-at" @mouseover="mouseover" @mouseleave="mouseleave"></span><span class="mention-pubkey">{{ pubkey }}</span></RouterLink>
	</template>
	<template v-else>{{ pubkey }}</template>
	`
}
