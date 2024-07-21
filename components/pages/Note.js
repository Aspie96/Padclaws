import AlertView from "../AlertView.js"
import FeedView from "../FeedView.js"
import NoteView from "../NoteView.js"
import Session from "../../js/session.js"
import UsersCache from "../UsersCache.js"
import utils from "../../js/utils.js"
import WriteView from "../WriteView.js"

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
			isReply: false,
			showReplies: false,
			trustedReplies: [],
			otherReplies: [],
			loadAllBtn: false,
			repliesUntil: null,
			noReplies: false,
			loadingReplies: false,
			branchLoaded: false,
			submitting: false,
			replyId: null
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
			this.trustedReplies = [];
			this.otherReplies = [];
			this.isReply = false;
			this.showReplies = false;
			this.loadAllBtn = false;
			this.repliesUntil = null;
			this.noReplies = false;
			this.loadingReplies = false;
			this.branchLoaded = false;
			this.subId = null;
			this.trustedRepliers = new Set();
			this.fetchedIds = new Set();
			this.parent = null;
			this.ancestorsCache = {};
			this.submitting = false;
			this.replyId = null;
			const eventId = this.$route.params.id;
			const branchIndex = this.branch.findIndex(e => e.id == eventId);
			if(branchIndex != -1) {
				console.log("Found in branch");
				this.event = this.branch[branchIndex];
				this.branch.length = branchIndex;
				this.eventSet();
				return;
			}
			const replyIndex = this.replies.findIndex(e => e.id == eventId);
			if(replyIndex != -1) {
				this.branch.push(this.event);
				this.event = this.replies[replyIndex];
				this.eventSet();
				return;
			}
			this.event = null;
			this.branch = [];
			this.loading = true;
			if(!nostrUtils.isHashPrefix(eventId, 32)) {
				const decoded = nostrUtils.decodeEntity(eventId);
				if(decoded && (decoded.prefix == nostrEncEntityPrefixes.note || decoded.prefix == nostrEncEntityPrefixes.nevent) && nostrUtils.isHash(decoded.hex, 32)) {
					this.$router.replace({
						name: this.$route.matched[this.$route.matched.length - 1].name,
						params: {
							id: decoded.hex
						}
					});
				} else {
					this.invalid = true;
				}
				return;
			}
			var filters;
			if(history.state.event?.id == eventId) {
				console.log("Immediate.");
				this.event = history.state.event;
			} else {
				filters = {
					ids: [eventId],
					limit: 1
				};
				this.event = await nostrClient.fetchOne(filters);
				history.replaceState({ ...history.state, event: this.event }, "");
			}
			this.loading = false;
			var refs = nostrUtils.parseEQTags(this.event);
			this.isReply = !!refs.reply;
			this.trustedRepliers.add(nostrUtils.getAuthor(this.event));
			if(Session.logged) {
				this.trustedRepliers.add(Session.userKeys.public);
			}
			for(const tag of nostrUtils.getTagValues(this.event, "p")) {
				this.trustedRepliers.add(tag[1]);
			}
			if(Session.logged) {
				if(Session.refreshingFollowing) {
					await new Promise(resolve => {
						Vue.watch(() => Session.refreshingFollowing, resolve, { once: true });
					});
				}
				for(const user of Session.following.keys()) {
					this.trustedRepliers.add(user)
				}
			}
			if(refs.reply) {
				this.parent = refs.reply;
				this.ancestorsCache = {};
				this.ancestorIds = new Set([refs.reply]);
				if(refs.root) {
					this.ancestorIds.add(refs.root);
				}
				const filters = {
					ids: [...this.ancestorIds]
				};
				this.subId = nostrClient.fetchFeed(filters, event => this.handleAncestor(event));
			} else {
				this.loadInitialReplies();
			}
		},

		eventSet() {
			const refs = nostrUtils.parseEQTags(this.event);
			this.isReply = !!refs.reply;
			this.trustedRepliers.add(nostrUtils.getAuthor(this.event));
			if(Session.logged) {
				this.trustedRepliers.add(Session.userKeys.public);
			}
			for(const tag of nostrUtils.getTagValues(this.event, "p")) {
				this.trustedRepliers.add(tag[1]);
			}
			for(const user of Session.following.keys()) {
				this.trustedRepliers.add(user);
			}
			if(refs.reply) {
				this.parent = refs.reply;
				this.ancestorsCache = {};
				this.ancestorIds = new Set([refs.reply]);
				if(refs.root) {
					this.ancestorIds.add(refs.root);
				}
				for(const event of this.branch) {
					this.trustedRepliers.add(nostrUtils.getAuthor(event));
					for(const tag of nostrUtils.getTagValues(event, "p")) {
						this.trustedRepliers.add(tag[1]);
					}
				}
			}
			this.loadInitialReplies();
		},

		handleAncestor(event) {
			this.fetchedIds.add(event.id);
			var refs = nostrUtils.parseEQTags(event);
			this.fetchAncestors(refs);
			if(event.id == this.parent) {
				this.addToBranch(event, refs);
				if(this.parent) {
					while(this.parent && this.parent in this.ancestorsCache) {
						event = this.ancestorsCache[this.parent];
						refs = nostrUtils.parseEQTags(event);
						this.addToBranch(event, refs);
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

		addToBranch(event, refs) {
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
			this.parent = refs.reply;
		},

		fetchAncestors(refs) {
			if(refs.root) {
				this.ancestorIds.add(refs.root);
			}
			if(refs.reply) {
				this.ancestorIds.add(refs.reply);
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
				nostrClient.cancelSubscription(this.subId);
			}
			const filters = {
				authors: [...this.trustedRepliers],
				kinds: [nostrEventKinds.text_note],
				"#e": [this.event.id]
			};
			nostrClient.fetchFeed(filters, reply => {
				const refs = nostrUtils.parseEQTags(reply);
				if(refs.reply == this.event.id) {
					utils.addInOrder(this.trustedReplies, reply, dateComp);
				}
			});
			this.loadAllBtn = true;
		},

		async loadAll() {
			this.loadAllBtn = false;
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
							if(this.otherReplies.length == 6) {
								UsersCache.lock();
								setTimeout(() => {
									UsersCache.unlock();
								}, 500);
							}
							utils.addInOrder(this.otherReplies, reply, dateComp);
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
			const refs = nostrUtils.parseEQTags(reply);
			return refs.reply == this.event.id;
		},

		async onReplyData(data) {
			const content = data.content;
			const tags = data.tags;
			if(this.branch.length == 0) {
				const tag = ["e", this.event.id, "", "root", nostrUtils.getAuthor(this.event)];
				tags.unshift(tag);
			} else {
				var tag = ["e", this.branch[0].id, "", "root", nostrUtils.getAuthor(this.branch[0])];
				tags.unshift(tag);
				tag = ["e", this.event.id, "", "reply", nostrUtils.getAuthor(this.event)];
				tags.unshift(tag);
			}
			this.submitting = true;
			const keys = Session.userKeys;
			const event = await nostrClient.postNote(keys, content, tags);
			console.log(event);
			this.submitting = false;
			this.replyId = event.id;
			this.$refs.writeView.clear();
		}
	},

	computed: {
		logged() {
			return Session.logged;
		},

		noteId() {
			return this.event?.id || this.$route.params;
		},

		replies() {
			return this.trustedReplies.concat(this.otherReplies);
		}
	},

	components: {
		AlertView,
		FeedView,
		NoteView,
		WriteView
	},

	template:`
	<AlertView v-if="invalid" color="red" icon="alert-triangle">Invalid event ID. Check the URL.</AlertView>
	<template v-else>
		<FeedView v-if="isReply" :events="branch" isParent />
		<NoteView :key="event?.id" :loading="loading" :event="event" isActive />
		<h2>Replies</h2>
		<WriteView v-if="logged" :submitting="submitting" @data="onReplyData" :noteId="replyId" :storageKey="'/note/' + noteId" ref="writeView" />
		<template v-if="!loading">
			<FeedView :events="replies" />
			<button v-if="loadAllBtn" type="button" class="load-more-btn" @click="loadAll">
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
