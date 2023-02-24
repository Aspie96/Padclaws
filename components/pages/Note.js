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
			loadingReplies: false
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
			const eventId = this.$route.params.id;
			if(!nostrUtils.isHashPrefix(eventId, 32)) {
				this.invalid = true;
				return;
			}
			this.invalid = false;
			this.loading = true;
			this.event = null;
			var filters = {
				ids: [this.$route.params.id],
				limit: 1
			};
			this.event = await nostrClient.fetchOne(filters);
			this.loading = false;
			var eTags = nostrUtils.parseETags(this.event);
			this.otherReplies = [];
			this.trustedReplies = [];
			this.loadMoreBtn = false;
			this.repliesUntil = null;
			this.noReplies = false;
			this.loadingReplies = false;
			this.reply = !!eTags.reply;
			const trustedRepliers = [nostrUtils.getAuthor(this.event)];
			for(const tag of nostrUtils.getTagValues(this.event, "p")) {
				trustedRepliers.push(tag[1]);
			}
			if(eTags.reply) {
				this.branch = [];
				var parent = eTags.reply;
				while(parent) {
					const filters = {
						ids: [eTags.reply],
						limit: 1
					};
					parent = await nostrClient.fetchOne(filters);
					trustedRepliers.push(nostrUtils.getAuthor(parent));
					for(const tag of nostrUtils.getTagValues(parent, "p")) {
						trustedRepliers.push(tag[1]);
					}
					eTags = nostrUtils.parseETags(parent);
					this.branch.unshift(parent);
					parent = eTags.reply;
				}
			}
			filters = {
				authors: trustedRepliers,
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
			const filters = {
				kinds: [nostrEventKinds.text_note],
				"#e": [this.event.id],
				limit: 10
			};
			if(this.repliesUntil) {
				filters.until = this.repliesUntil + 1;
			}
			this.loadingReplies = true;
			const exist = await nostrClient.checkEventExists(filters, reply => !this.replies.some(event => event.id == reply.id));
			if(exist) {
				nostrClient.fetchFeed(filters, reply => {
					const eTags = nostrUtils.parseETags(reply);
					if(eTags.reply == this.event.id) {
						if(!this.repliesUntil || reply.created_at < this.repliesUntil) {
							this.repliesUntil = reply.created_at;
						}
						if(!this.replies.some(event => event.id == reply.id)) {
							addInOrder(this.otherReplies, reply, dateComp);
							this.loadMoreBtn = true;
							this.loadingReplies = false;
						}
					}
				});
			} else {
				this.noReplies = true;
				this.loadingReplies = false;
				this.loadMoreBtn = false;
			}
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
	<AlertView v-if="invalid" color="red" icon="alert-triangle">Invalid event ID. Check the URL.</AlertView>
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
