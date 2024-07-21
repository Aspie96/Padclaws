import LinkView from "./LinkView.js"
import MagnetLinkView from "./MagnetLinkView.js"
import MentionView from "./MentionView.js"
import NostrUriView from "./NostrUriView.js"
import UsersCache from "./UsersCache.js"
import utils from "../js/utils.js"

/*var re_source = re_weburl.source;
re_source = re_source.slice(1, re_source.length - 1)
re_source = "\\b(" + re_source + ")\\b";
const re_link = new RegExp(re_source, "ig");*/

function *findItems(text) {
	const regexes = [
		utils.re_link,
		/(?<!(?:(?=[^#\ufe5f\uff03])[\p{XID_Continue}\p{Extended_Pictographic}\p{Emoji_Component}\-+_]))([#\ufe5f\uff03](?:(?=[^#\ufe5f\uff03])[\p{XID_Continue}\p{Extended_Pictographic}\p{Emoji_Component}\-+_])+)/gu,
		/\b(magnet:\?\S+)\b/g,
		/(?:(?<=\s)@|^@)([0-9a-f]{16,64}\b)/g,
		/(?:\b|(?<=\s)@|^@)(?:nostr\:)?(nprofile1[a-zA-HJ-NP-Z0-9]{58,})\b/g,
		/(?:\b|(?<=\s)@|^@)(?:nostr\:)?(npub1[a-zA-HJ-NP-Z0-9]{58})\b/g,
		/\b(?:nostr\:)?(note1[a-zA-HJ-NP-Z0-9]{58})\b/g,
		/\b(?:nostr\:)?(nevent1[a-zA-HJ-NP-Z0-9]{58,})\b/g
	];
	const itemNames = [
		"url",
		"hashtag",
		"magnetURI",
		"mention",
		"nostrURI",
		"nostrURI",
		"nostrURI",
		"nostrURI",
	];
	yield* utils.tokenize(text, regexes, itemNames);
};

export default {
	name: "TextView",

	props: {
		text: String,
		quotedId: String
	},

	computed: {
		items() {
			const items = [...findItems(this.text)];
			if(items.length > 1 && items[items.length - 1].value.trim() == "") {
				items.length--;
			}
			if(this.quotedId) {
				const lastItem = items[items.length - 1];
				if(lastItem.type == "nostrURI") {
					const entity = nostrUtils.decodeEntity(lastItem.value);
					if(entity.hex == this.quotedId) {
						items.length--;
						if(items.length > 0 && items[items.length - 1].type == "text") {
							items[items.length - 1].value = items[items.length - 1].value.trimRight();
						}
					}
				}
			}
			const mentionItems = items.filter(i => i.type == "mention");
			if(mentionItems.length > 1) {
				const mentions = new Set();
				for(const item of mentionItems) {
					if(nostrUtils.isHashPrefix(item.value, 32)) {
						mentions.add(item.value);
					} else {
						const entity = nostrUtils.decodeEntity(item.value);
						mentions.add(entity.hex);
					}
				}
				if(mentions.size > 1) {
					UsersCache.fetchMultipleMetadata([...mentions]);
				}
			}
			return items;
		}
	},

	components: {
		LinkView,
		MagnetLinkView,
		MentionView,
		NostrUriView
	},

	template: `
	<template v-for="(item, index) in items">
		<template v-if="index < items.length">
			<template v-if="item.type == 'text'">{{ item.value }}</template>
			<LinkView v-else-if="item.type == 'url'" :url="item.value" />
			<MentionView v-else-if="item.type == 'mention'" :pubkey="item.value" />
			<NostrUriView v-else-if="item.type == 'nostrURI'" :text="item.value" />
			<MagnetLinkView v-else-if="item.type == 'magnetURI'" :uri="item.value" />
			<RouterLink v-else-if="item.type == 'hashtag'" :to="{ name: 'tag', params: { tag: item.value.substr(1) } }">{{ item.value }}</RouterLink>
		</template>
	</template>
	`
}
