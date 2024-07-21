import AlertView from "./AlertView.js"
import utils from "../js/utils.js";

function* findItems(text) {
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
		"mention",
		"mention",
		"eventURI",
		"eventURI",
	];
	yield* utils.tokenize(text, regexes, itemNames);
}

function pushTag(tags, tag) {
	if(!tags.some(t => t.length == tag.length && t.every((v, i) => v == tag[i]))) {
		tags.push(tag);
	}
}

async function partsToNote(parts) {
	var content = "";
	const tags = [];
	for(const part of parts) {
		if(part.type == "text") {
			content += part.value;
		} else if(part.type == "url") {
			content += part.value;
			pushTag(tags, ["r", part.value]);
			const normUrl = new URL(parts.value).href;
			if(normUrl != part.value) {
				pushTag(tags, ["r", normUrl]);
			}
		} else if(part.type == "hashtag") {
			content += part.value;
			const hashtag = part.value.substring(1);
			pushTag(tags, ["t", hashtag]);
			const normHashtag = hashtag.normalize("NFKC").toLowerCase();
			if(normHashtag != hashtag) {
				pushTag(tags, ["t", normHashtag]);
			}
		} else if(part.type == "mention") {
			var nostrUrl;
			var pubkey;
			var relay;
			if(nostrUtils.isHashPrefix(part.value, 32)) {
				pubkey = part.value;
				nostrUrl = nostrUtils.encodeEntity(nostrEncEntityPrefixes.npub, pubkey);
				nostrUrl = "nostr:" + nostrUrl;
			} else {
				nostrUrl = "nostr:" + part.value;
				console.log(part.value);
				const entity = nostrUtils.decodeEntity(part.value);
				pubkey = entity.hex;
				if(entity.prefix == nostrEncEntityPrefixes.nprofile && entity.relays.length == 1) {
					relay = entity.relays[0];
				}
			}
			content += nostrUrl;
			pushTag(tags, ["p", pubkey, ...(relay ? [relay] : [])]);
		} else if(part.type == "eventURI") {
			var nostrUrl = part.value;
			nostrUrl = "nostr:" + part.value;
			content += nostrUrl;
			const entity = nostrUtils.decodeEntity(part.value);
			const eventID = entity.hex;
			var pubkey;
			var relay;
			if(entity.prefix == nostrEncEntityPrefixes.nevent) {
				if(entity.author) {
					pubkey = entity.author;
				}
				if(entity.relays.length == 1) {
					relay = entity.relays[0];
				}
			}
			if(!pubkey) {
				const filters = {
					ids: [eventID],
					limit: 1
				};
				const event = await nostrClient.fetchOne(filters);
				pubkey = event?.pubkey;
			}
			if(pubkey) {
				pushTag(tags, ["q", eventID, relay || "", pubkey]);
				pushTag(tags, ["e", eventID, relay || "", "mention", pubkey]);
				pushTag(tags, ["p", pubkey]);
			} else {
				pushTag(tags, ["q", eventID, ...(relay ? [relay] : [])]);
				pushTag(tags, ["e", eventID, relay || "", "mention"]);
			}
		}
	}
	console.log(content);
	console.log(tags);
	return {
		content,
		tags
	}
}

export default {
	props: {
		submitting: Boolean,
		storageKey: null
	},

	data() {
		return {
			note: ""
		};
	},

	emits: [
		"data",
		"submit"
	],

	methods: {
		saveFormDataState() {
			if(this.$props.storageKey) {
				sessionStorage.setItem(this.storageKey, this.note);
			}
		},

		clear() {
			this.note = "";
			sessionStorage.removeItem(this.storageKey);
		},

		async onSubmit() {
			const parts = findItems(this.note);
			const data = await partsToNote(parts);
			this.$emit("data", data);
		}
	},

	created() {
		if(this.storageKey) {
			this.note = sessionStorage.getItem(this.storageKey) || "";
		}
	},

	components: {
		AlertView
	},

	template: `
	<form @submit.prevent="onSubmit" @change="saveFormDataState">
		<textarea required v-model="note" name="note" :disabled="submitting" placeholder="Here's the problem with teleportation&hellip;"></textarea>
		<div class="form-buttons">
			<button type="submit" class="btn-submit" :disabled="!note.trim() || submitting">Publish</button>
		</div>
	</form>
	`
}
