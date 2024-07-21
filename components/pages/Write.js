import Session from "../../js/session.js"
import WriteView from "../WriteView.js"

export default {
	data() {
		return {
			submitting: false,
			Session
		};
	},

	methods: {
		async onData(data) {
			this.submitting = true;
			const keys = this.Session.userKeys;
			const event = await nostrClient.postNote(keys, data.content, data.tags);
			this.submitting = false;
			this.$refs.writeView.clear();
			this.$router.push({ name: "note", params: { id: event.id } });
		}
	},

	components: {
		WriteView
	},

	template: `
	<write-view :submitting="submitting" @data="onData" storageKey="/write" ref="writeView" />
	`
}
