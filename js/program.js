import Note from "../components/pages/Note.js"
import Feed from "../components/pages/Feed.js"
import Write from "../components/pages/Write.js"
import MenuView from "../components/MenuView.js"

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
});

const relays = await (await fetch("../data/relays.json")).json();

window.nostrClient = createNostrClient(relays);

const app = Vue.createApp({
	components: {
		MenuView,
		RouterView: VueRouter.RouterView
	}
});

app.use(router);

app.mount("#app");
