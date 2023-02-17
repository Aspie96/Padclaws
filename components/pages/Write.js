import WriteView from "../WriteView.js"
import Session from "../../js/session.js"

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
			this.submitting = true;
			const keys = this.Session.userKeys;
			const event = await nostrClient.postNote(keys, note);
			this.submitting = false;
			this.noteId = event.id;
			this.$refs.writeView.note = "";
		}
	},

	components: {
		WriteView
	},

	template: `
	<write-view :submitting="submitting" @submit="onSubmit" :noteId="noteId" storageKey="/write" ref="writeView" />
	`
}
