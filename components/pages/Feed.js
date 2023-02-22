import AlertView from "../AlertView.js"
import FeedView from "../FeedView.js"

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
			() => {
			this.fetchData()
			},
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
			if(!await nostrClient.hasEvents(authorId)) {
				this.loading = false;
				this.noEvents = true;
				return;
			}
			this.noEvents = false;
			this.since = await nostrClient.getReasonableTimestamp(authorId);
			this.loading = false;
			const subId = nostrClient.getFeed(event => {
				var index = 0;
				while(index < this.events.length && this.events[index].created_at > event.created_at) {
					index++;
				}
				this.events.splice(index, 0, event);
				this.loadMoreBtn = true;
			}, authorId, this.since);
			this.subIds.push(subId);
		},

		async loadMore() {
			this.loadMoreBtn = false;
			this.loading = true;
			const authorId = this.$route.params.id;
			if(!await nostrClient.hasEvents(authorId, undefined, this.since)) {
				this.loading = false;
				this.noEvents = true;
				return;
			}
			this.noEvents = false;
			const until = this.since;
			this.since = await nostrClient.getReasonableTimestamp(authorId, until);
			this.loading = false;
			const subId = nostrClient.getFeed(event => {
				var index = 0;
				while(index < this.events.length && this.events[index].created_at > event.created_at) {
					index++;
				}
				this.events.splice(index, 0, event);
				this.loadMoreBtn = true;
			}, authorId, this.since, undefined, until);
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
