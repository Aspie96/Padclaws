import AlertView from "./AlertView.js"
import DropdownView from "./DropdownView.js"
import MentionView from "./MentionView.js"
import Session from "../js/session.js"
import TextView from "./TextView.js"
import UsersCache from "./UsersCache.js"

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
			mention: null
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
	},

	methods: {
		async fetchData() {
			if(this.event) {
				const author = nostrUtils.getAuthor(this.event);
				UsersCache.fetchMetadata(author);
				this.authorData = UsersCache.users[author];
				this.mention = null;
			}
		},

		async fetchMention() {
			if(this.note?.mention?.length == 1) {
				console.log(this.note);
				const filters = {
					ids: [this.note.mention[0]],
					limit: 1
				};
				const event = await nostrClient.fetchMostRecent(filters);
				this.mention = event;
			}
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
		}
	},

	components: {
		AlertView,
		DropdownView,
		MentionView,
		TextView
	},

	template: `
	<AlertView v-if="loading" color="blue" icon="hourglass">Loading&hellip;</AlertView>
	<template v-else-if="isRepost">
		<NoteView :event="mention" :repostedBy="note.author" />
	</template>
	<template v-else>
		<article v-if="note" class="note-box" :class="{ 'is-parent': isParent, 'is-active': isActive, 'is-mention': isMention }">
			<div v-if="repostedBy" class="in-reply-to"><span class="ti ti-message"></span>Reposted by <MentionView :pubkey="repostedBy" /></div>
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
					<TextView :text="note.content" />
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
