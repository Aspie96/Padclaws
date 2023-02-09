"use strict";

const eventKinds = Object.freeze({
	set_metadata: 0,
	text_note: 1,
	recommend_server: 2
});

const relays = [
	"nostr.lnprivate.network"
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
	privateKey = Array.from(new Uint8Array(privateKey))
	privateKey = privateKey.map(b => b.toString(16).padStart(2, "0")).join("");
	return privateKey;
}

function getPublicKey(privateKey) {
	var publicKey = nobleSecp256k1.schnorr.getPublicKey(privateKey);
	publicKey = publicKey.map(b => b.toString(16).padStart(2, "0")).join("");
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

function signEvent(eventHash, privateKey) {
	var signature = nobleSecp256k1.schnorr.signSync(eventHash, privateKey)
	signature = signature.map(b => b.toString(16).padStart(2, "0")).join("");
	return signature;
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
	event.sig = signEvent(event.id, keys.private);
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

const socket = new WebSocket("wss://" + relays);

socket.addEventListener("open", async (e) => {
	const event = await demoEvent();
	var message = ["EVENT", event];
	message = JSON.stringify(message);
    socket.send(message);
});

socket.addEventListener("message", (event) => {
    console.log("Message from server ", event.data);
});
