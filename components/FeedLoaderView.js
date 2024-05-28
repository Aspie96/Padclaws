import AlertView from "./AlertView.js"
import FeedView from "./FeedView.js"
import Session from "../js/session.js"
import utils from "../js/utils.js"

function dateComp(event1, event2) {
	return event1.created_at - event2.created_at;
}

export default {
	props: {
		filters: Object
	},

	data() {
		return {
			loading: false,
			noEvents: false,
			events: [],
			newEvents: [],
			loadMoreBtn: false,
			newEventsBtn: false
		};
	},

	created() {
		this.$watch(
			() => this.filters,
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
			this.loading = true;
			this.noEvents = false;
			this.events = [];
			this.newEvents = [];
			this.loadMoreBtn = false;
			this.newEventsBtn = false;
			this.until = null;
			this.subIds = [];
			var filters = {
				...this.filters,
				limit: 1
			};
			const recent = await nostrClient.fetchMostRecent(filters);
			if(!recent) {
				this.loading = false;
				this.noEvents = true;
				return;
			}
			this.noEvents = false;
			filters.until = recent.created_at - 1;
			const previous = await nostrClient.fetchMostRecent(filters);
			var timestamp;
			if(previous) {
				this.until = recent.created_at;
				timestamp = previous.created_at;
			} else {
				timestamp = recent.created_at;
			}
			const since = utils.getReasonableTimestamp(this.until, timestamp);
			filters = {
				...this.filters,
				since
			};
			this.until = since;
			this.loading = false;
			const subId = nostrClient.fetchFeed(filters, event => {
				const time = Date.now();
				if(this.events.length == 0) {
					this.timeFirstEvent = time;
					this.loadMoreBtn = true;
				}
				if(time > this.timeFirstEvent + 10 * 1000) {
					this.newEvents.push(event);
					this.newEventsBtn = true;
				} else {
					utils.addInOrder(this.events, event, dateComp);
				}
			});
			this.subIds.push(subId);
		},

		async loadMore() {
			this.loadMoreBtn = false;
			this.loading = true;
			var filters = {
				...this.filters,
				until: this.until,
				limit: 1
			};
			const recent = await nostrClient.fetchMostRecent(filters);
			if(!recent) {
				this.noEvents = true;
				this.loading = false;
				return;
			}
			this.noEvents = false;
			const since = utils.getReasonableTimestamp(this.until, recent.created_at);
			filters = {
				...this.filters,
				since,
				until: this.until
			};
			this.until = since;
			this.loading = false;
			const subId = nostrClient.fetchFeed(filters, event => {
				utils.addInOrder(this.events, event, dateComp);
				this.loadMoreBtn = true;
			});
			this.subIds.push(subId);
		},

		loadNew() {
			for(const event of this.newEvents) {
				utils.addInOrder(this.events, event, dateComp);
			}
			this.newEvents.length = 0;
			this.newEventsBtn = false;
			this.timeFirstEvent = Date.now();
		}
	},

	components: {
		AlertView,
		FeedView
	},

	template:`
	<button v-if="newEventsBtn" type="button" class="load-more-btn" @click="loadNew">Load new <span class="badge">{{ newEvents.length }}</span></button>
	<FeedView :events="events" replyTo />
	<AlertView v-if="loading" color="blue" icon="hourglass">Loading&hellip;</AlertView>
	<AlertView v-else-if="noEvents" color="blue" icon="mood-empty">
		<template v-if="events.length == 0">No events found.</template>
		<template v-else>No other events found.</template>
	</AlertView>
	<button v-else-if="loadMoreBtn" type="button" class="load-more-btn" @click="loadMore"><span class="ti ti-chevrons-down"></span>Load more&hellip;<span class="ti ti-chevrons-down"></span></button>
	`
}
