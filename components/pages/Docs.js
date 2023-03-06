export default {
	data() {
		return {
			title: "",
			html: ""
		};
	},

	created() {
		this.$watch(
			() => this.$route.params,
			this.fetchData,
			{ immediate: true }
		);
	},

	methods: {
		async fetchData() {
			const page = this.$route.params.page;
			const pages = {
				"privacy": { title: "Privacy policy" }
			};
			if(page in pages) {
				this.title = pages[page].title;
				this.html = (await (await fetch("/docs/" + page + ".html")).text());
			}
		}
	},

	template:`
	<div class="remove-margin">
		<h1>{{title}}</h1>
		<div class="settings">
			<nav class="side-menu">
				<ul>
					<li>
						<RouterLink :to="{ name: 'docs', params: { page: 'privacy' } }">Privacy</RouterLink>
					</li>
				</ul>
			</nav>
			<div class="settings-content" v-html="html"></div>
		</div>
	</div>
	`
}
