function GetPage(page) {
	return Vue.defineAsyncComponent(async () => {
		const doc = await (await fetch("docs/" + page + ".html")).text();
		return {
			template: doc
		};
	});
}

export default {
	data() {
		return {
			title: "",
			page: ""
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
		fetchData() {
			const page = this.$route.params.page;
			const pages = {
				privacy: { title: "Privacy policy" },
				about: { title: "About" }
			};
			if(page in pages) {
				this.title = pages[page].title;
				this.page = page;
			}
		}
	},

	components: {
		privacyPage: GetPage("privacy"),
		aboutPage: GetPage("about")
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
					<li>
						<RouterLink :to="{ name: 'docs', params: { page: 'about' } }">About</RouterLink>
					</li>
				</ul>
			</nav>
			<div class="settings-content text">
				<Component :is="page + 'Page'" />
			</div>
		</div>
	</div>
	`
}
