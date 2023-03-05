import WriteView from "../WriteView.js"
import Session from "../../js/session.js"

const mentionRegex = /(@(?:npub[a-zA-HJ-NP-Z0-9]{59}|[a-f0-9]{8,64}))\b/g;

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
			console.log(part);
			var pubkey = part.value.substring(1);
			if(pubkey.startsWith("npub")) {
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
		tags
	}
}

export default {
	data() {
		return {
			submitting: false,
			noteId: null,
			Session
		};
	},

	methods: {
		async onSubmit(note) {
			const parts = parseNote(note);
			const data = createNote(parts);
			console.log(data);
			this.submitting = true;
			const keys = this.Session.userKeys;
			const event = await nostrClient.postNote(keys, data.content, data.tags);
			this.submitting = false;
			this.noteId = event.id;
			this.$refs.writeView.clear();
		}
	},

	components: {
		WriteView
	},

	template: `
	<write-view :submitting="submitting" @submit="onSubmit" :noteId="noteId" storageKey="/write" ref="writeView" />
	`
}
