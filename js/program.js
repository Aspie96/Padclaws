import Note from "../components/pages/Note.js"
import Write from "../components/pages/Write.js"
import MenuView from "../components/MenuView.js"
import Login from "../components/pages/Login.js"
import Settings from "../components/pages/Settings.js"
import SettingsProfile from "../components/pages/Settings/SettingsProfile.js"
import SettingsRelays from "../components/pages/Settings/SettingsRelays.js"
import User from "../components/pages/User.js"
import UserInfo from "../components/pages/User/UserInfo.js"
import UserNotes from "../components/pages/User/UserNotes.js"
import UserRelays from "../components/pages/User/UserRelays.js"

const Home = { template: "<div>Home</div>" }

const routes = [
	{ path: "/", name: "home", component: Home },
	{ path: "/note/:id", name:"note", component: Note },
	{ path: "/write", name:"write", component: Write },
	{ path: "/login", name:"login", component: Login },
	{
		path: "/user/:pubkey",
		component: User,
		children: [
			{ path: "", name: "user", component: UserNotes },
			{ path: "info", name: "user-info", component: UserInfo },
			{ path: "relays", name: "user-relays", component: UserRelays}
		]
	},
	{
		path: "/settings",
		component: Settings,
		children: [
			{
				path: "relays",
				name: "settings-relays",
				component: SettingsRelays,
				meta: {title: "Relays | Settings"}
			},
			{
				path: "profile",
				name: "settings-profile",
				component: SettingsProfile,
				meta: {title: "Profile | Settings"}
			}
		],
		meta: { title: "Settings" }
	}
]

const router = VueRouter.createRouter({
	history: VueRouter.createWebHashHistory(),
	routes
});

const app = Vue.createApp();

app.component("MenuView", MenuView);

const DEFAULT_TITLE = "Padclaws";

router.afterEach((to, from) => {
    Vue.nextTick(() => {
        document.title = to.meta.title || DEFAULT_TITLE;
    });
});

app.use(router);

app.mount("#app");
