"use strict";

const nostrEventKinds = Object.freeze({
	set_metadata: 0,
	text_note: 1,
	recommend_server: 2
});

const relays = [
	"wss://nostr.nodeofsven.com",
	"wss://no-str.org",
	"wss://offchain.pub"
];


const nostrUtils = function() {
	async function hashString(text) {
		const textAsBuffer = new TextEncoder().encode(text);
		const hashBuffer = await window.crypto.subtle.digest("SHA-256", textAsBuffer);
		const hashArray = Array.from(new Uint8Array(hashBuffer))
		const digest = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
		return digest;
	}

	async function hashEvent(event) {
		var serialized = [
			0,
			event.pubkey,
			event.created_at,
			event.kind,
			event.tags,
			event.content
		];
		serialized = JSON.stringify(serialized);
		const digest = await hashString(serialized);
		return digest;
	}

	function generatePrivateKey() {
		var privateKey = new Uint8Array(32);
		crypto.getRandomValues(privateKey);
		privateKey = nobleSecp256k1.utils.bytesToHex(privateKey);
		return privateKey;
	}

	function getPublicKey(privateKey) {
		var publicKey = nobleSecp256k1.schnorr.getPublicKey(privateKey);
		publicKey = nobleSecp256k1.utils.bytesToHex(publicKey);
		return publicKey;
	}

	function generateKeys() {
		const sk = generatePrivateKey();
		const keys = {
			private: sk,
			public: getPublicKey(sk)
		}
		return Object.freeze(keys);;
	}

	async function signEvent(eventHash, privateKey) {
		var signature = await nobleSecp256k1.schnorr.sign(eventHash, privateKey)
		signature = nobleSecp256k1.utils.bytesToHex(signature);
		return signature;
	}

	function isHash(value, length) {
		if(typeof value != "string") {
			return false;
		}
		const regex = new RegExp(`^[0-9a-f]{${length * 2}}$`);
		return regex.test(value);
	}

	async function verifyEvent(event) {
		if(!isHash(event.id, 32)) return false;
		if(!isHash(event.pubkey, 32)) return false;
		if(!Number.isSafeInteger(event.created_at)) return false;
		if(!Number.isSafeInteger(event.kind)) return false;
		if(!Array.isArray(event.tags)) return false;
		if(typeof event.content != "string") return false;
		if(!isHash(event.sig, 64)) return false;
		for(const tag of event.tags) {
			if(!Array.isArray(tag)) return false;
			if(tag.length < 1) return false;
			for(const str of tag) {
				if(typeof str != "string") return false;
			}
		}
		const hash = await hashEvent(event);
		if(event.id != hash) return false;
		const sigVer = !nobleSecp256k1.verify(event.sig, event.id, event.pubkey);
		if(!sigVer) return false;
		return true;
	}

	async function createEvent(keys, kind, tags, content) {
		if(typeof kind == "string") {
			kind = nostrEventKinds[kind];
		}
		const timestampMs = Date.now();
		const timestamp = Math.round(timestampMs / 1000);
		var event = {
			pubkey: keys.public,
			created_at: timestamp,
			kind: kind,
			tags: tags,
			content: content
		};
		event.id = await hashEvent(event);
		event.sig = await signEvent(event.id, keys.private);
		return Object.freeze(event);
	}

	function getAuthor(event) {
		return event.pubkey;
	}

	function getDate(event) {
		return new Date(event.created_at * 1000);
	}

	function testEvent(filters, event) {
		if("ids" in filters) {
			if(!filters.ids.includes(event.id)) return false;
		}
		if("authors" in filters) {
			if(!filters.authors.includes(getAuthor(event))) return false;
		}
		if("kinds" in filters) {
			if(!filters.kinds.includes(event.kind)) return false;
		}
		if("since" in filters) {
			if(event.created_at <= filters.since) return false;
		}
		if("until" in filters) {
			if(event.created_at >= filters.since) return false;
		}
		return true;
	}

	return Object.freeze({
		generatePrivateKey,
		getPublicKey,
		generateKeys,
		getAuthor,
		getDate,
		verifyEvent,
		createEvent,
		testEvent
	});
}();


const nostrClient = function(relays) {
	const sockets = relays.map(relay => new WebSocket(relay));
	const subscriptions = {};

	function sendToSockets(message) {
		message = JSON.stringify(message);
		const openSockets = sockets.filter(socket => socket.readyState == WebSocket.OPEN);
		const requests = openSockets.map(socket => socket.send(message));
		return requests;
	}

	function generateSubId() {
		return crypto.randomUUID();
	}

	async function cancelSubscription(id) {
		delete subscriptions[id];
		const message = ["CLOSE", id];
		return await sendToSockets(message);
	}

	function createSubscription(filters, callback, subId) {
		subId ||= generateSubId();
		const message = ["REQ", subId, filters];
		sendToSockets(message);
		subscriptions[subId] = event => {
			if(nostrUtils.testEvent(filters, event)) {
				callback(event);
			}
		};
		return subId;
	}

	function getEventById(id) {
		const filters = { "ids": [id] };
		return new Promise(resolve => {
			const subId = createSubscription(filters, event => {
				cancelSubscription(subId);
				resolve(event);
			});
		});
	}

	function getFeed(callback, authors, since, subId) {
		if(typeof authors == "string") {
			authors = [authors];
		}
		const filters = { "authors": authors };
		if(Number.isInteger(since)) {
			filters.since = since;
		}
		const collectedIds = [];
		subId = createSubscription(filters, event => {
			if(!collectedIds.includes(event.id)) {
				collectedIds.push(event.id);
				callback(event);
			}
		}, subId);
		return subId;
	}

	async function postNote(keys, content) {
		const kind = nostrEventKinds.text_note;
		const tags = [];
		const event = await nostrUtils.createEvent(keys, kind, tags, content);
		const requests = sendEvent(event);
		await Promise.any(requests);
		return event;
	}

	for(const socket of sockets) {
		socket.addEventListener("open", async (e) => {});
		socket.addEventListener("message", e => {
			const message = JSON.parse(e.data);
			const type = message[0]
			if(type == "EVENT") {
				const subId = message[1];
				if(!(subId in subscriptions)) return;
				const event = Object.freeze(message[2]);
				if(!nostrUtils.verifyEvent(event)) return;
				subscriptions[subId](event);
			}
		});
	}

	function sendEvent(sockets, event) {
		const message = ["EVENT", event];
		const requests = sendToSockets(sockets, message);
		return requests;
	}

	return Object.freeze({
		getEventById,
		getFeed,
		postNote,
		sendEvent
	});
}(relays);
