import AlertView from "./AlertView.js"
import DropdownView from "./DropdownView.js"
import LinkView from "./LinkView.js"
import MentionView from "./MentionView.js"
import ReferenceView from "./ReferenceView.js"
import Session from "../js/session.js"
import UsersCache from "./UsersCache.js"

/*var re_source = re_weburl.source;
re_source = re_source.slice(1, re_source.length - 1)
re_source = "\\b(" + re_source + ")\\b";
const re_link = new RegExp(re_source, "ig");*/

const re_link = /\b((?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#](?:\S*[^\s\.,!\?>\)\]\};\:\"\'])?)?)/gi;

function* yieldText(text) {
	yield {
		type: "text",
		value: text
	};
}

function* findByRegex(text, regex, itemName, def) {
	var m;
	var index = 0;
	do {
		m = regex.exec(text);
		if(m) {
			const item = m[1];
			yield* def(text.slice(index, m.index));
			yield {
				type: itemName,
				value: item
			};
			index = m.index + m[0].length;
		}
	} while(m);
	yield* def(text.slice(index));
}

export default {
	name: "NoteView",

	props: {
		event: Object,
		loading: Boolean,
		replyTo: Boolean,
		isParent: Boolean,
		isActive: Boolean,
		isMention: Boolean,
		repostedBy: String
	},

	data() {
		return {
			authorData: { loading: true },
			mention: null,
			repostedData: null
		};
	},

	created() {
		this.$watch(
			() => this.event,
			this.fetchData,
			{ immediate: true }
		);

		this.$watch(
			() => this.note,
			this.fetchMention,
			{ immediate: true }
		);

		this.$watch(
			() => this.repostedBy,
			this.fetchReposted,
			{ immediate: true }
		);
	},

	methods: {
		async fetchData() {
			if(this.event) {
				const author = nostrUtils.getAuthor(this.event);
				UsersCache.fetchMetadata(author);
				this.authorData = UsersCache.users[author];
			}
		},

		async fetchMention() {
			if(this.note?.mention?.length == 1) {
				const filters = {
					ids: [this.note.mention[0]],
					limit: 1
				};
				const event = await nostrClient.fetchMostRecent(filters);
				this.mention = event;
			}
		},

		fetchReposted() {
			if(this.repostedBy) {
				UsersCache.fetchMetadata(this.repostedBy);
				this.repostedData = UsersCache.users[this.repostedBy];
			}
		},

		*findItems(text) {
			const neventRegex = /(nostr\:note1[a-zA-HJ-NP-Z0-9]{58}\b)/g;
			const findNoteURIs = text => findByRegex(text, neventRegex, "noteURI", yieldText);
			const mentionRegex = /(nostr\:npub1[a-zA-HJ-NP-Z0-9]{58}\b)/g;
			const findMentions = text => findByRegex(text, mentionRegex, "mention", findNoteURIs);
			yield* findByRegex(text, re_link, "url", findMentions);
		}
	},

	computed: {
		note() {
			if(!this.event) {
				return null;
			}
			const note = {
				id: this.event.id,
				author: nostrUtils.getAuthor(this.event),
				content: this.event.content,
				date: nostrUtils.getDate(this.event),
			};
			const eTags = nostrUtils.parseETags(this.event);
			if(this.replyTo) {
				note.reply = eTags.reply;
			}
			note.mention = eTags.mention;
			return note;
		},

		menuItems() {
			const menu = [
				{
					text: "Go to note",
					onClick: () => {
						this.$router.push({ name: "note", params: { id: this.note.id } });
					}
				},
				{
					text: "Copy web URL",
					onClick: () => {
						const route = this.$router.resolve({ name: "note", params: { id: this.note.id } });
						const href = route.href;
						const url = location.origin + location.pathname + href;
						navigator.clipboard.writeText(url);
					}
				},
				{
					text: "Copy Hex note ID",
					onClick: () => {
						navigator.clipboard.writeText(this.note.id);
					}
				},
				{
					text: "Copy encoded note ID",
					onClick: () => {
						const noteId = nostrUtils.encodeEntity(nostrEncEntityPrefixes.note, this.note.id);
						navigator.clipboard.writeText(noteId);
					}
				},
				{
					text: "Copy Nostr URI",
					onClick: () => {
						const noteId = nostrUtils.encodeEntity(nostrEncEntityPrefixes.note, this.note.id);
						const uri = "nostr:" + noteId;
						navigator.clipboard.writeText(uri);
					}
				}
			];
			if(Session.logged) {
				menu.push({
					text: "Repost",
					onClick: () => {
						const tags = [];
						tags.push(["e", this.note.id, "", "mention"]);
						nostrClient.postNote(Session.userKeys, "", tags);
					}
				});
			}
			return menu;
		},

		isRepost() {
			return this.note.content == "" && this.mention;
		},

		repostedSelfUser() {
			return Session.logged && Session.userKeys.public == this.repostedBy;
		}
	},

	components: {
		AlertView,
		DropdownView,
		LinkView,
		MentionView,
		ReferenceView
	},

	template: `
	<AlertView v-if="loading" color="blue" icon="hourglass">Loading&hellip;</AlertView>
	<template v-else-if="isRepost">
		<NoteView :event="mention" :repostedBy="note.author" />
	</template>
	<template v-else>
		<article v-if="note" class="note-box" :class="{ 'is-parent': isParent, 'is-active': isActive, 'is-mention': isMention }">
				<div v-if="repostedBy" class="in-reply-to"><span class="ti ti-message"></span>Reposted by
				
				<RouterLink v-if="repostedData?.metadata?.name" :to="{ name: 'user', params: { repostedBy } }" class="mention" :class="{ 'mention-self': repostedSelfUser }"><span class="ti ti-at"></span>{{ repostedData.metadata.name  }}</RouterLink>
				<RouterLink v-else :to="{ name: 'user', params: { repostedBy } }" class="mention" :class="{ 'mention-self': repostedSelfUser }"><span class="ti ti-at"></span><span class="mention-repostedBy">{{ repostedBy }}</span></RouterLink>
				
				</div>
				<div v-else-if="replyTo && note.reply" class="in-reply-to"><span class="ti ti-message"></span>In reply to note <RouterLink class="note-id" :to="{ name: 'note', params: { id: note.reply } }">{{ note.reply }}</RouterLink></div>
				<div class="note-body">
					<div class="note-data">
						<div class="author-data">
							<RouterLink v-if="!authorData.loading" class="username" :title="note.author" :to="{ name: 'user', params: { pubkey: note.author } }">{{ authorData.metadata.name }}</RouterLink>
							<RouterLink class="user-pubkey" :title="note.author" :to="{ name: 'user', params: { pubkey: note.author } }">{{ note.author }}</RouterLink>
						</div>
						<DropdownView :items="menuItems" />
					</div>
					<div class="note-content">
						<template v-for="item in findItems(note.content)">
							<template v-if="item.type == 'text'">{{ item.value }}</template>
							<LinkView v-else-if="item.type == 'url'" :url="item.value" />
							<MentionView v-else-if="item.type == 'mention'" :event="event" :text="item.value" />
							<ReferenceView v-else-if="item.type == 'noteURI'" :event="event" :text="item.value" />
						</template>
						<NoteView v-if="mention" :event="mention" isMention />
					</div>
					<p class="note-date">
						<RouterLink :to="{ name: 'note', params: { id: note.id } }">
							<time :datetime="note.date.toISOString()">{{ note.date.toLocaleString() }}</time>
						</RouterLink>
					</p>
				</div>
		</article>
	</template>
	`
}
