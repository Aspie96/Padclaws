import AlertView from "../AlertView.js"
import FeedView from "../FeedView.js"

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
	data() {
		return {
			invalid: false,
			loading: false,
			noEvents: false,
			events: [],
			loadMoreBtn: false,
			since: 0,
			subIds: []
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
			for(const subId of this.subIds) {
				nostrClient.cancelSubscription(subId);
			}
			this.subIds = [];
			this.loadMoreBtn = false;
			this.noEvents = false;
			this.events = [];
			const authorId = this.$route.params.id;
			if(!nostrUtils.isHashPrefix(authorId, 32)) {
				this.loading = false;
				this.invalid = true;
				return;
			}
			this.loading = true;
			this.invalid = false;
			var filters = {
				authors: [authorId],
				kinds: [nostrEventKinds.text_note],
				since: this.since,
				limit: 1
			};
			if(!await nostrClient.checkEventExists(filters)) {
				this.loading = false;
				this.noEvents = true;
				return;
			}
			this.noEvents = false;
			this.since = await nostrClient.getReasonableTimestamp(authorId);
			this.loading = false;
			filters = {
				authors: [authorId],
				kinds: [nostrEventKinds.text_note],
				since: this.since
			};
			const subId = nostrClient.fetchFeed(filters, event => {
				addInOrder(this.events, event, dateComp);
				this.loadMoreBtn = true;
			});
			this.subIds.push(subId);
		},

		async loadMore() {
			this.loadMoreBtn = false;
			this.loading = true;
			const authorId = this.$route.params.id;
			var filters = {
				authors: [authorId],
				since: this.since,
				until,
				limit: 1
			};
			if(!await nostrClient.checkEventExists(filters)) {
				this.loading = false;
				this.noEvents = true;
				return;
			}
			this.noEvents = false;
			const until = this.until;
			this.since = await nostrClient.getReasonableTimestamp(authorId, until);
			this.loading = false;
			filters = {
				authors: [authorId],
				since: this.since,
				until
			};
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
