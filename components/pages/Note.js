import AlertView from "../AlertView.js"
import FeedView from "../FeedView.js"
import NoteView from "../NoteView.js"

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
			loading: false,
			invalid: false,
			event: null,
			reply: false,
			branch: [],
			showReplies: false,
			trustedReplies: [],
			otherReplies: [],
			loadMoreBtn: false,
			repliesUntil: null,
			noReplies: false,
			loadingReplies: false,
			branchLoaded: false,
			noRelays: false
		};
	},

	created() {
		this.$watch(
			() => this.$route.params,
			this.fetchData,
			{ immediate: true }
		);
	},

	methods: {
		async fetchData() {
			this.loading = false;
			this.invalid = false;
			this.event = null;
			this.reply = false;
			this.branch = [];
			this.showReplies = false;
			this.trustedReplies = [];
			this.otherReplies = [];
			this.loadMoreBtn = false;
			this.repliesUntil = null;
			this.noReplies = false;
			this.loadingReplies = false;
			this.branchLoaded = false;
			this.subId = null;
			this.trustedRepliers = new Set();
			this.fetchedIds = new Set();
			this.parent = null;
			this.ancestorsCache = {};
			this.noRelays = false;
			if(nostrClient.noRelays()) {
				this.noRelays = true;
				return;
			}
			this.loading = true;
			const eventId = this.$route.params.id;
			if(!nostrUtils.isHashPrefix(eventId, 32)) {
				this.invalid = true;
				return;
			}
			var filters = {
				ids: [this.$route.params.id],
				limit: 1
			};
			this.event = await nostrClient.fetchOne(filters);
			this.loading = false;
			var eTags = nostrUtils.parseETags(this.event);
			this.reply = !!eTags.reply;
			this.trustedRepliers.add(nostrUtils.getAuthor(this.event));
			for(const tag of nostrUtils.getTagValues(this.event, "p")) {
				this.trustedRepliers.add(tag[1]);
			}
			if(eTags.reply) {
				this.parent = eTags.reply;
				this.ancestorsCache = {};
				this.ancestorIds = new Set([...eTags.mention, eTags.reply]);
				if(eTags.root) {
					this.ancestorIds.add(eTags.root);
				}
				const filters = {
					ids: [...this.ancestorIds]
				};
				this.subId = nostrClient.fetchFeed(filters, event => this.handleAncestor(event));
			} else {
				this.loadInitialReplies();
			}
		},

		handleAncestor(event) {
			this.fetchedIds.add(event.id);
			var eTags = nostrUtils.parseETags(event);
			this.fetchAncestors(eTags);
			if(event.id == this.parent) {
				this.addToBranch(event, eTags);
				if(this.parent) {
					while(this.parent && this.parent in this.ancestorsCache) {
						event = this.ancestorsCache[this.parent];
						eTags = nostrUtils.parseETags(event);
						this.addToBranch(event, eTags);
					}
					if(!this.parent) {
						this.loadInitialReplies();
					}
				} else {
					this.loadInitialReplies();
				}
			} else {
				this.ancestorsCache[event.id] = event;
			}
		},

		addToBranch(event, eTags) {
			this.trustedRepliers.add(nostrUtils.getAuthor(event));
			for(const tag of nostrUtils.getTagValues(event, "p")) {
				this.trustedRepliers.add(tag[1]);
			}
			const element = document.querySelector(".is-active");
			const offset = element.offsetTop;
			this.branch.unshift(event);
			this.$nextTick(() => {
				const shift = element.offsetTop - offset;
				document.documentElement.scrollTop += shift;
			});
			this.parent = eTags.reply;
		},

		fetchAncestors(eTags) {
			for(const id of eTags.mention) {
				this.ancestorIds.add(id);
			}
			if(eTags.root) {
				this.ancestorIds.add(eTags.root);
			}
			if(eTags.reply) {
				this.ancestorIds.add(eTags.reply);
			}
			this.ancestorIds = new Set([...this.ancestorIds].filter(id => !this.fetchedIds.has(id)));
			if(this.ancestorIds.size > 0) {
				const filters = {
					ids: [...this.ancestorIds]
				};
				nostrClient.fetchFeed(filters, event => this.handleAncestor(event), "read", this.subId);
			}
		},

		loadInitialReplies() {
			if(this.subId) {
				nostrClient.cancelSubscription();
			}
			const filters = {
				authors: [...this.trustedRepliers],
				kinds: [nostrEventKinds.text_note],
				"#e": [this.event.id]
			};
			nostrClient.fetchFeed(filters, reply => {
				const eTags = nostrUtils.parseETags(reply);
				if(eTags.reply == this.event.id) {
					addInOrder(this.trustedReplies, reply, dateComp);
				}
			});
			this.loadMoreBtn = true;
		},

		async loadMore() {
			this.loadMoreBtn = false;
			var filters = {
				kinds: [nostrEventKinds.text_note],
				"#e": [this.event.id]
			};
			this.loadingReplies = true;
			const exists = await nostrClient.checkEventExists(filters, this.isDirectReply);
			if(exists) {
				nostrClient.fetchFeed(filters, reply => {
					if(this.isDirectReply(reply)) {
						if(!this.replies.some(event => event.id == reply.id)) {
							addInOrder(this.otherReplies, reply, dateComp);
							this.loadingReplies = false;
						}
					}
				});
			} else {
				this.noReplies = true;
				this.loadingReplies = false;
			}
		},

		isDirectReply(reply) {
			const eTags = nostrUtils.parseETags(reply);
			return eTags.reply == this.event.id;
		}
	},

	computed: {
		replies() {
			return this.trustedReplies.concat(this.otherReplies);
		}
	},

	components: {
		AlertView,
		FeedView,
		NoteView
	},

	template:`
	<AlertView v-if="noRelays" color="yellow" icon="alert-triangle">
		<p>No relays set.</p>
		<p>Before fetching data, you must add some <RouterLink :to="{ name: 'settings-relays' }">relays</RouterLink>.</p>
	</AlertView>
	<AlertView v-else-if="invalid" color="red" icon="alert-triangle">Invalid event ID. Check the URL.</AlertView>
	<template v-else>
		<FeedView v-if="reply" :events="branch" isParent />
		<NoteView :loading="loading" :event="event" isActive />
		<template v-if="!loading">
			<h2>Replies</h2>
			<FeedView :events="replies" />
			<button v-if="loadMoreBtn" type="button" class="load-more-btn" @click="loadMore">
				<span class="ti ti-chevrons-down"></span>
				<template v-if="replies.length">Other replies&hellip;</template>
				<template v-else="replies.length">Load replies&hellip;</template>
				<span class="ti ti-chevrons-down"></span>
			</button>
			<AlertView v-if="loadingReplies" color="blue" icon="hourglass">Loading replies&hellip;</AlertView>
			<AlertView v-else-if="noReplies" color="blue" icon="mood-empty">
				<template v-if="replies.length == 0">No replies found.</template>
				<template v-else>No other replies.</template>
			</AlertView>
		</template>
	</template>
	`
}
