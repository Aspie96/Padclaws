import AlertView from "./AlertView.js"
import LinkView from "./LinkView.js"
import MentionView from "./MentionView.js"
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
			index = m.index + item.length;
		}
	} while(m);
	yield* def(text.slice(index));
}

export default {
	props: {
		event: Object,
		loading: Boolean,
		replyTo: Boolean,
		isParent: Boolean,
		isActive: Boolean
	},

	data() {
		return {
			authorData: { loading: true }
		};
	},

	created() {
		this.$watch(
			() => this.event,
			this.fetchData,
			{ immediate: true }
		);
	},

	methods: {
		fetchData() {
			if(this.event) {
				const author = nostrUtils.getAuthor(this.event);
				UsersCache.fetchMetadata(author);
				this.authorData = UsersCache.users[author];
			}
		},

		*findItems(text) {
			const mentionRegex = /(#\[[0-9]+\])/g;
			yield* findByRegex(text, re_link, "url", text => findByRegex(text, mentionRegex, "mention", yieldText));
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
			if(this.replyTo) {
				const eTags = nostrUtils.parseETags(this.event);
				note.reply = eTags.reply;
			}
			return note;
		}
	},

	components: {
		AlertView,
		LinkView,
		MentionView
	},

	template: `
	<AlertView v-if="loading" color="blue" icon="hourglass">Loading&hellip;</AlertView>
	<article v-if="note" class="note-box" :class="{ 'is-parent': isParent, 'is-active': isActive }">
		<header>
			<div v-if="replyTo && note.reply" class="in-reply-to"><span class="ti ti-message"></span>In reply to note <router-link class="note-id" :to="'/note/' + note.reply">{{ note.reply }}</router-link></div>
			<div class="note-data">
				<div class="author-data">
					<p v-if="!authorData.loading" class="username">{{ authorData.metadata.name }}</p>
					<router-link class="user-pubkey" :title="note.author" :to="'/user/' + note.author">{{ note.author }}</router-link>
				</div>
				<router-link class="note-date" :to="'/note/' + note.id">
					<time :datetime="note.date.toISOString()">{{ note.date.toLocaleString() }}</time>
				</router-link>
			</div>
		</header>
		<div class="note-content">
			<template v-for="item in findItems(note.content)">
				<template v-if="item.type == 'text'">{{ item.value }}</template>
				<LinkView v-else-if="item.type == 'url'" :url="item.value" />
				<template v-else-if="item.type == 'mention'">
					<MentionView :event="event" :mention="item.value" />
				</template>
			</template>
		</div>
	</article>
	`
}
