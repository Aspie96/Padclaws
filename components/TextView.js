import LinkView from "./LinkView.js"
import MagnetLinkView from "./MagnetLinkView.js";
import NostrUriView from "./NostrUriView.js"

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
	name: "TextView",

	props: { text: String },

	methods: {
		*findItems(text) {
			const neventRegex = /\b(nostr\:nevent1[a-zA-HJ-NP-Z0-9]{58,}\b)/g;
			const findEventURIs = text => findByRegex(text, neventRegex, "nostrURI", yieldText);
			const noteRegex = /\b(nostr\:note1[a-zA-HJ-NP-Z0-9]{58}\b)/g;
			const findNoteURIs = text => findByRegex(text, noteRegex, "nostrURI", findEventURIs);
			const mentionRegex = /\b(nostr\:npub1[a-zA-HJ-NP-Z0-9]{58}\b)/g;
			const findMentions = text => findByRegex(text, mentionRegex, "nostrURI", findNoteURIs);
			const magnetRegex = /\b(magnet:\?\S+)\b/g;
			const findMagnets = text => findByRegex(text, magnetRegex, "magnetURI", findMentions);
			yield* findByRegex(text, re_link, "url", findMagnets);
		}
	},

	components: {
		LinkView,
		MagnetLinkView,
		NostrUriView
	},

	template: `
	<template v-for="item in findItems(text)">
		<template v-if="item.type == 'text'">{{ item.value }}</template>
		<LinkView v-else-if="item.type == 'url'" :url="item.value" />
		<NostrUriView v-else-if="item.type == 'nostrURI'" :text="item.value" />
		<MagnetLinkView v-else-if="item.type == 'magnetURI'" :uri="item.value" />
	</template>
	`
}
