import Docs from "../components/pages/Docs.js"
import Feed from "../components/pages/Feed.js"
import Home from "../components/pages/Home.js"
import Login from "../components/pages/Login.js"
import MenuView from "../components/MenuView.js"
import Note from "../components/pages/Note.js"
import NoRelays from "../components/pages/NoRelays.js"
import Notifications from "../components/pages/Notifications.js"
import Settings from "../components/pages/Settings.js"
import SettingsData from "../components/pages/Settings/SettingsData.js"
import SettingsProfile from "../components/pages/Settings/SettingsProfile.js"
import SettingsRelays from "../components/pages/Settings/SettingsRelays.js"
import Tag from "../components/pages/Tag.js"
import User from "../components/pages/User.js"
import UserFollowers from "../components/pages/User/UserFollowers.js"
import UserFollowing from "../components/pages/User/UserFollowing.js"
import UserBoxView from "../components/UserBoxView.js"
import UserInfo from "../components/pages/User/UserInfo.js"
import UserNotes from "../components/pages/User/UserNotes.js"
import UserRelays from "../components/pages/User/UserRelays.js"
import Write from "../components/pages/Write.js"
import Variables from "./variables.js"
import HistoryStore from "./historyStore.js"

const routes = [
	{ path: "/:pathMatch(.*)*", name: "noRelays", component: NoRelays },
	{ path: "/", name: "home", component: Home },
	{ path: "/note/:id", name: "note", component: Note, meta: { requiresRelays: true } },
	{ path: "/write", name:  "write", component: Write, meta: { requiresRelays: true } },
	{ path: "/login", name:"login", component: Login },
	{
		path: "/user/:pubkey",
		component: User,
		meta: { requiresRelays: true },
		children: [
			{ path: "", name: "user", component: UserNotes },
			{ path: "followers", name: "user-followers", component: UserFollowers },
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
				meta: {title: "Profile | Settings"},
				meta: { requiresRelays: true }
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
	{ path: "/feed", name:  "feed", component: Feed, meta: { requiresRelays: true } },
	{ path: "/tag/:tag", name:  "tag", component: Tag },
	{ path: "/notifications", name:  "notifications", component: Notifications, meta: { requiresRelays: true } }
]

const router = VueRouter.createRouter({
	history: VueRouter.createWebHashHistory(),
	routes,
	scrollBehavior(to, from, savedPosition) {
		return savedPosition || { top: 0 };
	}
});

const app = Vue.createApp();

app.component("MenuView", MenuView);
console.log(Variables);
app.config.globalProperties.variables = Variables;
app.component("UserBoxView", UserBoxView);

const DEFAULT_TITLE = "Padclaws";

router.beforeEach((to, from) => {
	if(to.meta.requiresRelays && nostrClient.noRelays()) {
		return {
			name: "noRelays",
			params: { pathMatch: to.path.split("/").slice(1) },
			query: to.query,
			hash: to.hash,
			component: User
		};
	}
})

router.afterEach((to) => {
    Vue.nextTick(() => {
        document.title = to.meta.title || DEFAULT_TITLE;
		HistoryStore.setPositionAndCurrent(history.state.position, history.state.current);
    });
});

app.use(router);

app.directive("click-outside", {
	mounted(el, binding) {
		el.clickOutsideEvent = ev => {
			if(!(el == ev.target || el.contains(ev.target))) {
				binding.value(ev);
			}
		};
		document.body.addEventListener("click", el.clickOutsideEvent);
	},

	unmounted(el) {
		document.body.removeEventListener("click", el.clickOutsideEvent);
	}
});

app.mount("#app");
