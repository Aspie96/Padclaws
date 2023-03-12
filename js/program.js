import Docs from "../components/pages/Docs.js"
import Home from "../components/pages/Home.js"
import Feed from "../components/pages/Feed.js"
import Login from "../components/pages/Login.js"
import MenuView from "../components/MenuView.js"
import Note from "../components/pages/Note.js"
import Settings from "../components/pages/Settings.js"
import SettingsData from "../components/pages/Settings/SettingsData.js"
import SettingsProfile from "../components/pages/Settings/SettingsProfile.js"
import SettingsRelays from "../components/pages/Settings/SettingsRelays.js"
import User from "../components/pages/User.js"
import UserFollowing from "../components/pages/User/UserFollowing.js"
import UserInfo from "../components/pages/User/UserInfo.js"
import UserNotes from "../components/pages/User/UserNotes.js"
import UserRelays from "../components/pages/User/UserRelays.js"
import Write from "../components/pages/Write.js"

const routes = [
	{ path: "/", name: "home", component: Home },
	{ path: "/note/:id", name: "note", component: Note },
	{ path: "/write", name:  "write", component: Write },
	{ path: "/login", name:"login", component: Login },
	{
		path: "/user/:pubkey",
		component: User,
		children: [
			{ path: "", name: "user", component: UserNotes },
			{ path: "following", name: "user-following", component: UserFollowing },
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
			},
			{
				path: "data",
				name: "settings-data",
				component: SettingsData,
				meta: {title: "Data | Settings"}
			}
		],
		meta: { title: "Settings" }
	},
	{ path: "/docs/:page", name: "docs", component: Docs },
	{ path: "/feed", name:  "feed", component: Feed }
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

app.directive("click-outside", {
	mounted(el, binding, vnode) {
		el.clickOutsideEvent = ev => {
			if(!(el == ev.target || el.contains(ev.target))) {
				binding.value(ev);
			}
		};
		document.body.addEventListener("click", el.clickOutsideEvent);
	},
	unmounted(el, binding) {
		document.body.removeEventListener("click", el.clickOutsideEvent);
	}
})

app.mount("#app");
