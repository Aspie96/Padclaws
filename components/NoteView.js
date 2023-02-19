import AlertView from "./AlertView.js";
import MentionView from "./MentionView.js";

/*var re_source = re_weburl.source;
re_source = re_source.slice(1, re_source.length - 1)
re_source = "\\b(" + re_source + ")\\b";
const re_link = new RegExp(re_source, "ig");*/

const re_link = /\b((?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#](?:\S*[^\s\.,!\?>\)\]\};\:])?)?)/gi;

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
			const url = m[1];
			yield* def(text.slice(index, m.index));
			yield {
				type: itemName,
				value: url
			};
			index = m.index + url.length;
		}
	} while(m);
	yield* def(text.slice(index));
}

export default {
	props: {
		event: Object,
		loading: Boolean
	},

	methods: {
		*findItems(text) {
			const mentionRegex = /#\[[0-9]+\]/g;
			yield* findByRegex(text, re_link, "url", text => findByRegex(text, mentionRegex, "mention", yieldText));
		},

		parseMention(mention) {
			var index = mention.substring(2, mention.length - 1);
			index = parseInt(index);
			const pTags = nostrUtils.getTagValues("p");
			const pubkey = pTags[index][1];
			return ;
		}
	},

	computed: {
		note() {
			if(!this.event) {
				return null;
			}
			return {
				id: this.event.id,
				author: nostrUtils.getAuthor(this.event),
				content: this.event.content,
				date: nostrUtils.getDate(this.event)
			};
		}
	},

	components: {
		AlertView,
		MentionView
	},

	template: `
	<AlertView v-if="loading" color="blue" icon="hourglass">Loading&hellip;</AlertView>
	<article class="note-box" v-if="note">
		<router-link class="user-pubkey" :title="note.author" :to="'/feed/' + note.author">{{ note.author }}</router-link>
		<router-link class="note-date" :to="'/note/' + note.id">
			<time :datetime="note.date.toISOString()">{{ note.date.toLocaleString() }}</time>
		</router-link>
		<div class="note-content">
			<template v-for="item in findItems(note.content)">
				<template v-if="item.type == 'text'">{{ item.value }}</template>
				<a v-else-if="item.type == 'url'" :href="item.value" rel="ugc">{{ item.value }}</a>
				<template v-else-if="item.type == 'mention'">
					<MentionView :event="event" :mention="item.value" />
				</template>
			</template>
		</div>
	</article>
	`
}
