import AlertView from "../../AlertView.js"
import Session from "../../../js/session.js"

function download(filename, text, mime) {
	mime ||= "application/json";
	const element = document.createElement("a");
	element.setAttribute("href", "data:" + mime + ";charset=utf-8," + encodeURIComponent(text));
	element.setAttribute("download", filename);
	element.style.display = "none";
	document.body.appendChild(element);
	element.click();
	document.body.removeChild(element);
}

export default {
	props: {
		logged: Boolean
	},

	data() {
		return {
			fetching: false,
			fetched: 0,
			fetchingComplete: false
		};
	},

	unmounted() {
		this.stopFetching();
	},

	components: {
		AlertView
	},

	methods: {
		stopFetching() {
			if(this.fetching) {
				clearInterval(this.timeout);
				this.timeout = null;
				nostrClient.cancelSubscription(this.subId);
				this.subId = null;
				this.fetching = false;
			}
		},

		downloadWeb() {
			var data = {
				localStorage,
				sessionStorage
			};
			data = JSON.stringify(data);
			download("Padclaws_WebStorage.json", data);
		},

		downloadLocal() {
			const data = JSON.stringify(localStorage);
			download("Padclaws_localStorage.json", data);
		},

		downloadSession() {
			const data = JSON.stringify(sessionStorage);
			download("Padclaws_sessionStorage.json", data);
		},

		clearWeb() {
			localStorage.clear();
			sessionStorage.clear();
			location.reload();
		},

		clearLocal() {
			localStorage.clear();
			location.reload();
		},

		clearSession() {
			sessionStorage.clear();
			location.reload();
		},

		fetchEvents() {
			this.fetching = true;
			this.fetchingComplete = false;
			this.fetched = 0;
			const filters = {
				authors: [Session.userKeys.public]
			};
			var fetched = false;
			const events = [];
			this.subId = nostrClient.fetchFeed(filters, event => {
				fetched = false;
				event = JSON.stringify(event);
				events.push(event);
				this.fetched++;
			}, "any");
			this.timeout = setInterval(() => {
				if(fetched) {
					this.stopFetching();
					const data = events.join("\n");
					download("Padclaws_events.jsonl", data, "application/x-ndjson");
					this.fetchingComplete = true;
				} else {
					fetched = true;
				}
			}, 5000);
		}
	},

	template: `
	<h2>Data</h2>
	<h3>Local data</h3>
	<div class="text">
		<p>Padclaws uses <a href="https://html.spec.whatwg.org/multipage/#toc-webstorage">Web Storage</a> to store local settings and access information and other data. This includes data stored in <i>sessionStorage</i> (which is erased after each browser session) and in <i>localStorage</i> (which is permanent).</p>
		<p>You can download all data stored in Web Storage, or specifically only the data stored in localStorage or sessionStorage.</p>
	</div>
	<div class="form-buttons form-buttons-left">
		<button type="button" @click="downloadWeb">Download Web Storage</button>
		<button type="button" @click="downloadLocal">Download localStorage</button>
		<button type="button" @click="downloadSession">Download sessionStorage</button>
	</div>
	<div class="text">
		<p>You can also clear your Web Storage. This will result in the loss of such data.</p>
		<p>If you clear your sessionStorage (which also happens when you clear your whole Web Storage), you are logged out of this session.</p>
	</div>
	<div class="form-buttons form-buttons-left">
		<button type="button" @click="clearWeb" class="btn-red">Clear Web Storage</button>
		<button type="button" @click="clearLocal" class="btn-red">Clear localStorage</button>
		<button type="button" @click="clearSession" class="btn-red">Clear sessionStorage</button>
	</div>
	<template v-if="logged">
	<h3>Published events</h3>
	<div class="text">
		<p>You can use this page to fetch the events you have published thus far on Nostr relays.</p>
		<p>This can take a while and the result cannot be guaranteed to be complete.</p>
	</div>
	<div class="form-buttons form-buttons-left">
		<button type="button" @click="fetchEvents" :disabled="fetching">Fetch events</button>
	</div>
	<AlertView v-if="fetching" color="blue" icon="hourglass">Fetching events. {{fetched}} events fetched so far.</AlertView>
	<AlertView v-else-if="fetchingComplete" color="blue" icon="check">Fetching complete. {{fetched}} events fetched.</AlertView>
	</template>
	`
}
