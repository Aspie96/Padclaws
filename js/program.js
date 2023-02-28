import Note from "../components/pages/Note.js"
import Write from "../components/pages/Write.js"
import MenuView from "../components/MenuView.js"
import Login from "../components/pages/Login.js"
import Relays from "../components/pages/Relays.js"
import User from "../components/pages/User.js"
import UserNotes from "../components/pages/User/UserNotes.js"
import UserInfo from "../components/pages/User/UserInfo.js"

const Home = { template: "<div>Home</div>" }

const routes = [
	{ path: "/", component: Home },
	{ path: "/note/:id", component: Note },
	{ path: "/write", component: Write },
	{ path: "/login", component: Login },
	{ path: "/relays", component: Relays },
	{
		path: "/user/:pubkey",
		component: User,
		children: [
			{ path: "", component: UserNotes },
			{ path: "info", component: UserInfo }
		]
	},
]

const router = VueRouter.createRouter({
	history: VueRouter.createWebHashHistory(),
	routes
});

const app = Vue.createApp();

app.component("MenuView", MenuView);

app.use(router);

app.mount("#app");
