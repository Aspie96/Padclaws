"use strict";

const eventKinds = Object.freeze({
	set_metadata: 0,
	text_note: 1,
	recommend_server: 2
});

const relays = [
	"wss://nostr.nodeofsven.com",
	"wss://no-str.org",
	"wss://offchain.pub"
];

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
		kind = eventKinds[kind];
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

async function demoEvent() {
	const keys = generateKeys();
	const kind = eventKinds.text_note;
	const tags = [];
	const content = "Demo";
	const event = await createEvent(keys, kind, tags, content);
	return event;
}

const sockets = relays.map((relay) => new WebSocket(relay));

function sendToSockets(sockets, message) {
	message = JSON.stringify(message);
	const requests = sockets.map(socket => {
		socket.send(message);
	});
	return requests;
}

function generateSubId() {
	return crypto.randomUUID();
}

const subscriptions = {};

async function cancelSubscription(sockets, id) {
	delete subscriptions[id];
	const message = ["CLOSE", id];
	return await sendToSockets(sockets, message);
}

function createSubscription(sockets, filters, callback, subId) {
	subId ||= generateSubId();
	const message = ["REQ", subId, filters];
	sendToSockets(sockets, message);
	subscriptions[subId] = callback;
	return subId;
}

function getEventById(sockets, id) {
	const filters = { "ids": [id] };
	return new Promise(resolve => {
		createSubscription(sockets, filters, event => {
			cancelSubscription(sockets, subId);
			resolve(event);
		});
	});
}

function getFeed(sockets, callback, authors, since, subId) {
	if(typeof authors == "string") {
		authors = [authors];
	}
	const filters = { "authors": authors };
	if(Number.isInteger(since)) {
		filters.since = since;
	}
	const collectedIds = [];
	subId = createSubscription(sockets, filters, event => {
		if(!collectedIds.includes(event.id) && authors.includes(event.pubkey)) {
			collectedIds.push(event.id);
			callback(event);
		}
	}, subId);
	return subId;
}

async function postNote(sockets, keys, content) {
	const kind = eventKinds.text_note;
	const tags = [];
	const event = await createEvent(keys, kind, tags, content);
	const requests = sendEvent(sockets, event);
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
			if(!verifyEvent(event)) return;
			subscriptions[subId](event);
		}
	});
}

function sendEvent(sockets, event) {
	const message = ["EVENT", event];
	const requests = sendToSockets(sockets, message);
	return requests;
}

async function demoSend() {
	const event = await demoEvent();
	await sendEvent(sockets, event);
	return event.id;
}

async function demoGet(id) {
	const event = await getEventById(id, sockets);
	return event;
}
