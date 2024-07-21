import NoteView from "./NoteView.js"

export default {
	props: {
		events: Array,
		replyTo: Boolean,
		isParent: Boolean
	},

	components: {
		NoteView
	},

	template: `
	<NoteView v-for="event in events" :key="event.id" :event="event" :replyTo="replyTo" :isParent="isParent" />
	`
}
