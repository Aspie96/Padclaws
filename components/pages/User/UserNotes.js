
import AlertView from "../../AlertView.js"
import FeedView from "../../FeedView.js"

function addInOrder(array, item, comp) {
	var index = 0;
	while(index < array.length && comp(item, array[index]) < 0) {
		index++;
	}
	array.splice(index, 0, item);
}

function dateComp(event1, event2) {
	return event1.created_at - event2.created_at;
}

export default {
	props: {
		pubkey: String,
		metadata: Object
	},

	data() {
		return {
			invalid: false,
			loading: false,
			noEvents: false,
			events: [],
			loadMoreBtn: false
		};
	},

	created() {
		this.$watch(
			() => this.$route.params,
			this.fetchData,
			{ immediate: true }
		);
	},

	unmounted() {
		for(const subId of this.subIds) {
			nostrClient.cancelSubscription(subId);
		}
	},

	methods: {
		async fetchData() {
			if(this.subIds) {
				for(const subId of this.subIds) {
					nostrClient.cancelSubscription(subId);
				}
			}
			this.invalid = false;
			this.loading = true;
			this.noEvents = false;
			this.events = [];
			this.loadMoreBtn = false;
			this.until = null;
			this.subIds = [];
			var filters = {
				authors: [this.pubkey],
				kinds: [nostrEventKinds.text_note],
				limit: 1
			};
			const recent = await nostrClient.fetchMostRecent(filters);
			if(!recent) {
				this.noEvents = true;
				this.loading = false;
				this.noEvents = true;
				return;
			}
			this.noEvents = false;
			const since = this.getReasonableTimestamp(recent.created_at);
			filters = {
				authors: [this.pubkey],
				kinds: [nostrEventKinds.text_note],
				since
			};
			this.until = since;
			this.loading = false;
			const subId = nostrClient.fetchFeed(filters, event => {
				addInOrder(this.events, event, dateComp);
				this.loadMoreBtn = true;
			});
			this.subIds.push(subId);
		},

		getReasonableTimestamp(timestamp) {
			const until = (this.until || Math.round(Date.now() / 1000));
			var timespan = until - timestamp;
			if(timespan < 60 * 60 * 12) {
				timespan = 60 * 60 * 24;
			} else if(timespan < 60 * 60 * 24 * 15) {
				timespan *= 2;
			}
			return until - timespan - 1;
		},

		async loadMore() {
			this.loadMoreBtn = false;
			this.loading = true;
			var filters = {
				authors: [this.pubkey],
				kinds: [nostrEventKinds.text_note],
				until: this.until,
				limit: 1
			};
			const recent = await nostrClient.fetchMostRecent(filters);
			if(!recent) {
				this.noEvents = true;
				this.loading = false;
				this.noEvents = true;
				return;
			}
			this.noEvents = false;
			const since = this.getReasonableTimestamp(recent.created_at);
			filters = {
				authors: [this.pubkey],
				kinds: [nostrEventKinds.text_note],
				since,
				until: this.until
			};
			this.until = since;
			this.loading = false;
			const subId = nostrClient.fetchFeed(filters, event => {
				addInOrder(this.events, event, dateComp);
				this.loadMoreBtn = true;
			});
			this.subIds.push(subId);
		}
	},

	components: {
		AlertView,
		FeedView
	},

	template:`
	<AlertView v-if="invalid" color="red" icon="alert-triangle">Invalid public key. Check the URL.</AlertView>
	<FeedView v-else :events="events" replyTo />
	<AlertView v-if="loading" color="blue" icon="hourglass">Loading&hellip;</AlertView>
	<AlertView v-if="noEvents" color="blue" icon="mood-empty">
		<template v-if="events.length == 0">No events found.</template>
		<template v-else>No other events found.</template>
	</AlertView>
	<button v-else-if="loadMoreBtn" type="button" class="load-more-btn" @click="loadMore"><span class="ti ti-chevrons-down"></span>Load more&hellip;<span class="ti ti-chevrons-down"></span></button>
	`
}
