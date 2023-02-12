export default {
	props: {
		note: Object,
		loading: Boolean
	},

	template: `
	<div v-if="loading">Loading...</div>
	<article v-if="note">
		<strong>{{ note.author }}</strong>
		<div>{{ note.content }}</div>
	</article>
	`
}
