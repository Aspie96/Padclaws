import NoteView from "./NoteView.js"

export default {
	props: {
		events: Array
	},

	components: {
		NoteView
	},

	template: `
	<NoteView v-for="event in events" :key="event.id" :event="event" />
	`
}
