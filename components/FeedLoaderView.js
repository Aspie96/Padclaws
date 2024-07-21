import AlertView from "./AlertView.js"
import FeedView from "./FeedView.js"
import utils from "../js/utils.js"
import HistoryStore from "../js/historyStore.js";

function dateComp(event1, event2) {
	return event1.created_at - event2.created_at;
}

export default {
	props: {
		filters: Object,
		postFilter: Function,
		fetchNew: Boolean,
		storeKey: String
	},

	data() {
		return {
			loading: false,
			noEvents: false,
			events: [],
			newEvents: {},
			loadMoreBtn: false
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
			const data = HistoryStore.getData(this.storeKey);
			if(data) {
				this.events = data.events;
				if(this.events?.length > 0) {
					this.newEvents = data.newEvents;
					this.until = data.until;
					this.loading = false;
					this.noEvents = false;
					this.loadMoreBtn = true;
					this.subIds = [];
					if(this.fetchNew) {
						const filters = {
							...this.filters,
							since: this.events[0].created_at
						};
						const subId = nostrClient.fetchFeed(filters, event => {
							var loaded = false;
							var i = 0;
							while(i < this.events.length && this.events[i].created_at == event.created_at) {
								if(this.events[i].id == event.id) {
									loaded = true;
								}
								i++;
							}
							if(!loaded) {
								this.newEvents[event.id] = event;
							}
						});
						this.subIds.push(subId);
					}
					return;
				}
			}
			this.loading = true;
			this.noEvents = false;
			this.events = [];
			this.newEvents = {};
			this.loadMoreBtn = false;
			this.until = null;
			this.subIds = [];
			if(!this.filters) {
				return;
			}
			var filters = {
				...this.filters,
				limit: 1
			};
			var loop = true;
			var recent;
			while(loop) {
				recent = await nostrClient.fetchMostRecent(filters);
				if(!recent || this.postFilter(recent)) {
					loop = false;
				} else {
					filters.until = utils.getReasonableTimestamp(filters.until, recent.created_at);
				}
			}
			if(!recent) {
				this.loading = false;
				this.noEvents = true;
				return;
			}
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
				since,
			};
			if(!this.fetchNew) {
				filters.until = recent.created_at;
			}
			this.until = since;
			this.loading = false;
			const subId = nostrClient.fetchFeed(filters, event => {
				const time = Date.now();
				if(this.events.length == 0) {
					this.timeFirstEvent = time;
					this.loadMoreBtn = true;
				}
				if(time > this.timeFirstEvent + 10 * 1000) {
					this.newEvents[event.id] = event;
				} else {
					utils.addInOrder(this.events, event, dateComp);
				}
			});
			this.subIds.push(subId);
		},

		storeData() {
			HistoryStore.storeData(this.storeKey, {
				events: this.events,
				newEvents: this.newEvents,
				until: this.until
			});
		},

		async loadMore() {
			this.loadMoreBtn = false;
			this.loading = true;
			var filters = {
				...this.filters,
				until: this.until,
				limit: 1
			};
			var loop = true;
			var recent;
			while(loop) {
				recent = await nostrClient.fetchMostRecent(filters);
				if(!recent || this.postFilter(recent)) {
					loop = false;
				} else {
					filters.until = utils.getReasonableTimestamp(filters.until, recent.created_at);
				}
			}
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
			var subId;
			var cancelled = false;
			var timeout = setTimeout(() => {
				cancelled = true;
				this.loadMoreBtn = true;
				nostrClient.cancelSubscription(subId);
			}, 1000);
			subId = nostrClient.fetchFeed(filters, event => {
				clearTimeout(timeout);
				timeout = setTimeout(() => {
					cancelled = true;
					this.loadMoreBtn = true;
					nostrClient.cancelSubscription(subId);
				}, 500);
				utils.addInOrder(this.events, event, dateComp);
			});
			this.subIds.push(subId);
		},

		loadNew() {
			for(const eventId in this.newEvents) {
				const event = this.newEvents[eventId];
				if(this.postFilter(event)) {
					utils.addInOrder(this.events, event, dateComp);
				}
				delete this.newEvents[eventId];
			}
		}
	},

	computed: {
		postFilteredEvents(object, prevVal) {
			const filtered = this.events.filter(this.postFilter);
			if(this.events && this.events.length > 0 && prevVal && prevVal.length != 0 && filtered.length == 0) {
				this.loadMore();
			}
			return filtered;
		},

		postFilteredNewEvents() {
			return Object.values(this.newEvents).filter(this.postFilter);
		}
	},

	components: {
		AlertView,
		FeedView
	},

	template:`
	<button v-if="fetchNew && postFilteredNewEvents.length > 0" type="button" class="load-more-btn" @click="loadNew">Load new <span class="badge">{{ postFilteredNewEvents.length }}</span></button>
	<FeedView :events="postFilteredEvents" replyTo />
	<AlertView v-if="loading" color="blue" icon="hourglass">Loading&hellip;</AlertView>
	<AlertView v-else-if="noEvents" color="blue" icon="mood-empty">
		<template v-if="events.length == 0">No events found.</template>
		<template v-else>No other events found.</template>
	</AlertView>
	<button v-else-if="loadMoreBtn" type="button" class="load-more-btn" @click="loadMore"><span class="ti ti-chevrons-down"></span>Load more&hellip;<span class="ti ti-chevrons-down"></span></button>
	`
}
