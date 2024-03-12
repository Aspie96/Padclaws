import AlertView from "../AlertView.js"
import FeedView from "../FeedView.js"
import NoteView from "../NoteView.js"
import Session from "../../js/session.js"
import WriteView from "../WriteView.js"

const mentionRegex = /(@(?:note[a-zA-HJ-NP-Z0-9]{59}|[a-f0-9]{8,64}))\b/g;

function* parseNote(text) {
	var m;
	var index = 0;
	do {
		m = mentionRegex.exec(text);
		if(m) {
			const item = m[1];
			yield {
				type: "text",
				value: text.slice(index, m.index)
			};
			yield {
				type: "mention",
				value: item
			};
			index = m.index + item.length;
		}
	} while(m);
	yield {
		type: "text",
		value: text.slice(index)
	};
}

function createNote(parts) {
	var content = "";
	const tags = [];
	const pMap = {};
	for(const part of parts) {
		if(part.type == "text") {
			content += part.value;
		} else if(part.type == "mention") {
			var pubkey = part.value.substring(1);
			if(pubkey.startsWith("note")) {
				const entity = nostrUtils.decodeEntity(pubkey);
				pubkey = entity.hex;
			}
			if(!(pubkey in pMap)) {
				pMap[pubkey] = tags.length;
				const tag = ["p", pubkey];
				tags.push(tag);
			}
			content += "#[" + pMap[pubkey] + "]";
			const tag = ["p", pubkey];
		}
	}
	return {
		content,
		pMap,
		tags
	}
}

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
			noRelays: false,
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
			this.isReply = false;
			this.showReplies = false;
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
			this.submitting = false;
			this.replyId = null;
			const eventId = this.$route.params.id;
			const branchIndex = this.branch.findIndex(e => e.id == eventId);
			if(branchIndex != -1) {
				this.trustedReplies = [];
				this.otherReplies = [];
				this.event = this.branch[branchIndex];
				console.log(branchIndex);
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
			this.trustedReplies = [];
			this.otherReplies = [];
			this.event = null;
			this.branch = [];
			if(nostrClient.noRelays()) {
				this.noRelays = true;
				return;
			}
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
			var filters = {
				ids: [this.$route.params.id],
				limit: 1
			};
			this.event = await nostrClient.fetchOne(filters);
			this.loading = false;
			var eTags = nostrUtils.parseETags(this.event);
			this.isReply = !!eTags.reply;
			this.trustedRepliers.add(nostrUtils.getAuthor(this.event));
			if(Session.logged) {
				this.trustedRepliers.add(Session.userKeys.public);
			}
			for(const tag of nostrUtils.getTagValues(this.event, "p")) {
				this.trustedRepliers.add(tag[1]);
			}
			for(const user of Session.following) {
				this.trustedRepliers.add(user)
			}
			if(eTags.reply) {
				this.parent = eTags.reply;
				this.ancestorsCache = {};
				this.ancestorIds = new Set([eTags.reply]);
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

		eventSet() {
			this.trustedReplies = [];
			this.otherReplies = [];
			var eTags = nostrUtils.parseETags(this.event);
			this.isReply = !!eTags.reply;
			this.trustedRepliers.add(nostrUtils.getAuthor(this.event));
			if(Session.logged) {
				this.trustedRepliers.add(Session.userKeys.public);
			}
			for(const tag of nostrUtils.getTagValues(this.event, "p")) {
				this.trustedRepliers.add(tag[1]);
			}
			for(const user of Session.following) {
				this.trustedRepliers.add(user);
			}
			if(eTags.reply) {
				this.parent = eTags.reply;
				this.ancestorsCache = {};
				this.ancestorIds = new Set([eTags.reply]);
				if(eTags.root) {
					this.ancestorIds.add(eTags.root);
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
				nostrClient.cancelSubscription(this.subId);
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
		},

		async onReplySubmit(note) {
			const parts = parseNote(note);
			const data = createNote(parts);
			const tags = data.tags;
			const addedPTags = new Set();
			for(const tag of nostrUtils.getTagValues(this.event, "p")) {
				const pubkey = tag[1];
				if(pubkey in data.pMap) {
					tags[data.pMap[pubkey]] = tag;
				} else if(!addedPTags.has(pubkey)) {
					addedPTags.add(pubkey);
					tags.push(tag);
				}
			}
			const pubkey = nostrUtils.getAuthor(this.event);
			if(!(pubkey in data.pMap) && !addedPTags.has(pubkey)) {
				const tag = ["p", pubkey, ""];
				tags.push(tag);
			}
			if(this.branch.length == 0) {
				const tag = ["e", this.event.id, "", "root"];
				tags.push(tag);
			} else {
				var tag = ["e", this.branch[0].id, "", "root"];
				tags.push(tag);
				tag = ["e", this.event.id, "", "reply"];
				tags.push(tag);
			}
			this.submitting = true;
			const keys = Session.userKeys;
			const event = await nostrClient.postNote(keys, data.content, tags);
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
	<AlertView v-if="noRelays" color="yellow" icon="alert-triangle">
		<p>No relays set.</p>
		<p>Before fetching data, you must add some <RouterLink :to="{ name: 'settings-relays' }">relays</RouterLink>.</p>
	</AlertView>
	<AlertView v-else-if="invalid" color="red" icon="alert-triangle">Invalid event ID. Check the URL.</AlertView>
	<template v-else>
		<FeedView v-if="isReply" :events="branch" isParent />
		<NoteView :key="event?.id" :loading="loading" :event="event" isActive />
		<h2>Replies</h2>
		<WriteView v-if="logged" :submitting="submitting" @submit="onReplySubmit" :noteId="replyId" :storageKey="'/note/' + noteId" ref="writeView" />
		<template v-if="!loading">
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
