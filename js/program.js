import Note from "../components/pages/Note.js"
import Feed from "../components/pages/Feed.js"
import Write from "../components/pages/Write.js"

const Home = { template: "<div>Home</div>" }

const routes = [
	{ path: '/', component: Home },
	{ path: "/note/:id", component: Note },
	{ path: "/feed/:id", component: Feed },
	{ path: "/write", component: Write }
]

const router = VueRouter.createRouter({
	history: VueRouter.createWebHashHistory(),
	routes
})

const app = Vue.createApp();

app.use(router);

app.mount("#app");

/*const app = createApp({
	components: {
		NoteView
	},
	created() {
		this.fetchData();
	},
	data() {
		return {
			note: null
		}
	},
	methods: {
		async fetchData() {
			const event = await nostrClient.getEventById("446e3abdddb3d10b9958ac0f4cdfef92081729994ffa26b35de2bb25bdd4cbd9");
			this.note = {
				author: nostrUtils.getAuthor(event),
				content: event.content
			};
		}
	}
});
app.mount("#app");*/

/*getEventById("446e3abdddb3d10b9958ac0f4cdfef92081729994ffa26b35de2bb25bdd4cbd9");*/


