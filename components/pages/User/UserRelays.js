
import AlertView from "../../AlertView.js"
import FeedView from "../../FeedView.js"
import Session from "../../../js/session.js"
import SuggestedRelaysView from "../../SuggestedRelaysView.js"
import UsedRelaysView from "../../UsedRelaysView.js"

export default {
	props: {
		pubkey: String,
		metadata: Object
	},

	data() {
		return {
			loading: false,
			noEvents: false,
			relays: new Set(),
			saved: false
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
			this.noEvents = false;
			this.relays = new Set();
			this.saved = false;
			const filters = {
				authors: [this.pubkey],
				kinds: [nostrEventKinds.relay_list_metadata],
				limit: 1
			};
			const event = await nostrClient.fetchMostRecent(filters);
			this.loading = false;
			if(!event) {
				this.noEvents = true;
				return;
			}
			const tags = nostrUtils.getTagValues(event, "r");
			for(const tag of tags) {
				const relay = tag[1];
				this.relays.add(new URL(relay).href);
			}
		},

		add(relay) {
			this.saved = false;
			Session.addRelay(relay, true, true);
			this.saved = true;
		},

		addAll() {
			this.saved = false;
			Session.addAllRelays();
			this.saved = true;
		},

		remove(relay) {
			this.saved = false;
			Session.removeRelay(relay, true, true);
			this.saved = true;
		},

		readWriteChange(relay, read, write) {
			this.saved = false;
			Session.setRelay(relay, read, write);
			this.saved = true;
		},
	},

	computed: {
		suggestedRelays() {
			const relays = new Set([...this.relays]);
			for(const relay of this.usedRelays) {
				relays.delete(relay[0])
			}
			return [...relays];
		},

		usedRelays() {
			const relays = Session.relays.used.filter(relay => this.relays.has(relay[0]));
			return relays;
		}
	},

	components: {
		AlertView,
		FeedView,
		SuggestedRelaysView,
		UsedRelaysView
	},

	template:`
	<AlertView v-if="loading" color="blue" icon="hourglass">Loading&hellip;</AlertView>
	<AlertView v-else-if="noEvents || relays.size == 0" color="blue" icon="mood-empty">No suggested relay.</AlertView>
	<template v-else>
		<UsedRelaysView :relays="usedRelays" legend="Common relays" @remove="remove" @readWriteChange="readWriteChange" />
		<SuggestedRelaysView :relays="suggestedRelays" legend="Suggested relays" @add="add" @addAll="addAll" />
		<AlertView v-if="saved" color="blue" icon="check">Preferences saved.</AlertView>
	</template>
	`
}
