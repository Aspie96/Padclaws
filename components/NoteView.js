import AlertView from "./AlertView.js"
import DropdownView from "./DropdownView.js"
import MentionView from "./MentionView.js"
import Session from "../js/session.js"
import TextView from "./TextView.js"
import UsersCache from "./UsersCache.js"
import Variables from "../js/variables.js"

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

	unmounted() {
		Variables.hoverCard = null;
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
			if(!this.isMention && this.note?.mention?.length == 1) {
				const noteId = this.note.mention[0];
				const filters = {
					ids: [noteId],
					limit: 1
				};
				if(this.event.kind == nostrEventKinds.repost && this.event.content != "") {
					const parsed = JSON.parse(this.event.content);
					if(nostrUtils.verifyEvent(parsed) && parsed.id == noteId) {
						this.mention = parsed;
						return;
					}
				}
				const event = await nostrClient.fetchOne(filters);
				this.mention = event;
			}
		},

		noteClicked(evt) {
			if(!this.isActive && document.getSelection().type != "Range") {
				const noteBody = this.$refs.noteBody;
				if(evt.srcElement == noteBody || evt.srcElement.parentNode == noteBody) {
					this.$router.push({ name: "note", params: { id: this.event.id }, state: { event: this.event }});
				}
			}
		},

		userMouseover() {
			Variables.hoverCard = this.event.pubkey;
			const rect = this.$refs.authorDataEl.getBoundingClientRect();
			Variables.hoverCardTop = rect.bottom + scrollY;
			Variables.hoverCardLeft = rect.left;
			Variables.displayed = true;
		},

		userMouseleave() {
			Variables.displayed = false;
			setTimeout(() => {
				if(!Variables.displayed) {
					Variables.hoverCard = null;
				}
			}, 0);
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
			const refs = nostrUtils.parseEQTags(this.event);
			if(this.replyTo) {
				note.reply = refs.reply;
			}
			note.mention = refs.mention;
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
						nostrClient.repostNote(Session.userKeys, this.event);
					}
				});
			}
			return menu;
		},

		isRepost() {
			return this.event?.kind == nostrEventKinds.repost;
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
		<NoteView :event="mention" :reposted-by="note.author" />
	</template>
	<template v-else>
		<article v-if="note" class="note-box" :class="{ 'is-parent': isParent, 'is-active': isActive, 'is-mention': isMention }">
			<div v-if="repostedBy" class="in-reply-to"><span class="ti ti-message"></span>Reposted by <MentionView :pubkey="repostedBy" /></div>
			<div v-else-if="replyTo && note.reply" class="in-reply-to"><span class="ti ti-message"></span>In reply to note <RouterLink class="note-id" :to="{ name: 'note', params: { id: note.reply } }" :title="note.reply"><span class="ti ti-notes"></span>{{ note.reply }}</RouterLink></div>
			<div class="note-body" @click="noteClicked" ref="noteBody">
				<div class="note-data">
					<div ref="authorDataEl" class="author-data" @mouseover="userMouseover" @mouseleave="userMouseleave">
						<RouterLink v-if="!authorData.loading" class="username" :to="{ name: 'user', params: { pubkey: note.author } }">{{ authorData.metadata.name || authorData.metadata.display_name }}</RouterLink>
						<RouterLink class="user-pubkey" :to="{ name: 'user', params: { pubkey: note.author } }">{{ note.author }}</RouterLink>
					</div>
					<DropdownView :items="menuItems" />
				</div>
				<div class="note-content">
					<TextView :text="note.content" :quoted-id="mention?.id" />
					<NoteView v-if="mention" :event="mention" is-mention />
				</div>
				<p class="note-date">
					<RouterLink :to="{ name: 'note', params: { id: note.id }, state: { event: event } }">
						<time :datetime="note.date.toISOString()">{{ note.date.toLocaleString() }}</time>
					</RouterLink>
				</p>
			</div>
		</article>
	</template>
	`
}
