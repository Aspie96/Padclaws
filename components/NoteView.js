export default {
	props: {
		note: Object,
		loading: Boolean
	},

	template: `
	<div v-if="loading">Loading...</div>
	<article class="note-box" v-if="note">
		<router-link class="user-pubkey" :to="'/feed/' + note.author">{{ note.author }}</router-link>
		<div class="note-content">{{ note.content }}</div>
	</article>
	`
}
