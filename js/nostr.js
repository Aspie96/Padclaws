"use strict";

function timeout(ms, retVal) {
	return new Promise(resolve => setTimeout(() => resolve(retVal), ms));
}

if(!window.structuredClone) {
	window.structuredClone = object => {
		return JSON.stringify(JSON.parse(object));
	}
}

const nostrEventKinds = Object.freeze({
	user_metadata: 0,
	text_note: 1,
	follows: 3,
	repost: 6,
	relay_list_metadata: 10002
});

const nostrEncEntityPrefixes = {
	npub: "npub",
	nprofile: "nprofile",
	nsec: "nsec",
	note: "note",
	nevent: "nevent"
};

const nostrUtils = function() {
	async function hashString(text) {
		const textAsBuffer = new TextEncoder().encode(text);
		const hashBuffer = await window.crypto.subtle.digest("SHA-256", textAsBuffer);
		const hashArray = Array.from(new Uint8Array(hashBuffer));
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
		privateKey = nobleCurves.utils.bytesToHex(privateKey);
		return privateKey;
	}

	function getPublicKey(privateKey) {
		var publicKey = nobleCurves.secp256k1_schnorr.getPublicKey(privateKey);
		publicKey = nobleCurves.utils.bytesToHex(publicKey);
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
		var signature = nobleCurves.secp256k1_schnorr.sign(eventHash, privateKey);
		signature = nobleCurves.utils.bytesToHex(signature);
		return signature;
	}

	function isHash(value, length) {
		if(typeof value != "string") {
			return false;
		}
		const regex = new RegExp(`^[0-9a-f]{${length * 2}}$`);
		return regex.test(value);
	}

	function isHashPrefix(value, length) {
		if(typeof value != "string") {
			return false;
		}
		const regex = new RegExp(`^[0-9a-f]{8,${length * 2}}$`);
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
		return nobleCurves.secp256k1_schnorr.verify(event.sig, event.id, event.pubkey);
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
			kind,
			tags,
			content
		};
		event.id = await hashEvent(event);
		event.sig = signEvent(event.id, keys.private);
		return Object.freeze(event);
	}

	function getAuthor(event) {
		return event.pubkey;
	}

	function getTagValues(event, tag) {
		return event.tags.filter(arr => arr[0] == tag);
	}

	function parseETags(event) {
		const tags = getTagValues(event, "e");
		if(tags.length == 0) {
			return {
				root: null,
				mention: [],
				reply: null
			};
		}
		if(tags.some(tag => tag.length >= 4)) {
			const selTags = tags.filter(tag => tag.length >= 4);
			if(selTags.length == 1 && selTags[0][3] == "root") {
				return {
					root: selTags[0][1],
					mention: [],
					reply: selTags[0][1]
				};
			}
			const result = {
				root: null,
				mention: [],
				reply: null
			};
			for(const tag of selTags) {
				if(tag[3] == "reply") {
					result.reply = tag[1];
				} else if(tag[3] == "mention") {
					result.mention.push(tag[1]);
				} else if(tag[3] == "root") {
					result.root = tag[1];
				}
			}
			return result;
		}
		if(event.kind == nostrEventKinds.repost) {
			return {
				root: null,
				mention: [...tags.map(t => t[1])],
				reply: null
			};
		}
		if(tags.length == 1) {
			return {
				root: tags[0][1],
				mention: [],
				reply: tags[0][1]
			};
		}
		return {
			root: tags[0][1],
			mention: [],
			reply: tags[tags.length - 1][1]
		};
	}

	function parseEQTags(event) {
		const result = parseETags(event);
		const tags = getTagValues(event, "q");
		result.mention.push(...tags.map(t => t[1]));
		result.mention = [...new Set(result.mention)];
		return result;
	}

	function getDate(event) {
		return new Date(event.created_at * 1000);
	}

	function testEvent(filters, event) {
		if("ids" in filters) {
			if(!filters.ids.some(id => event.id.startsWith(id))) return false;
		}
		if("authors" in filters) {
			if(!filters.authors.some(id => getAuthor(event).startsWith(id))) return false;
		}
		if("kinds" in filters) {
			if(!filters.kinds.includes(event.kind)) return false;
		}
		if("since" in filters) {
			if(event.created_at < filters.since) return false;
		}
		if("until" in filters) {
			if(event.created_at > filters.until) return false;
		}
		return true;
	}

	function encodeEntity(prefix, hex) {
		if(!nostrUtils.isHash(hex, 32)) {
			return null;
		}
		const data = nobleCurves.utils.hexToBytes(hex);
		const words = scureBase.bech32.toWords(data);
		return scureBase.bech32.encode(prefix, words);
	}


	function parseTLV(data) {
		const result = {};
		var rest = data;
		while(rest.length > 0) {
			const t = rest[0];
			const l = rest[1];
			if(!l) {
				return null;
			}
			const v = rest.slice(2, 2 + l);
			rest = rest.slice(2 + l);
			if(v.length < l) {
				return null;
			}
			result[t] = result[t] || [];
			result[t].push(v);
		}
		return result;
	}

	function toIntBigEndian(bytes) {
		return bytes[3] + (bytes[2] << 8) + (bytes[1] << 16) + (bytes[0] << 24);
	}

	const utf8Decoder = new TextDecoder("utf-8");

	function decodeEntity(entity) {
		const original = scureBase.bech32.decodeUnsafe(entity, 5000);
		if(!original) {
			return null;
		}
		const prefix = original.prefix;
		const words = original.words;
		const data = scureBase.bech32.fromWords(words);
		if(prefix == nostrEncEntityPrefixes.nprofile) {
			const tlv = parseTLV(data);
			if(!tlv[0]?.[0] || tlv[0][0].length !== 32) {
				return null;
			}
			const pubkey = nobleCurves.utils.bytesToHex(tlv[0][0]);
			const relays = tlv[1] ? tlv[1].map(d => utf8Decoder.decode(d)) : [];
			return {
				prefix,
				hex: pubkey,
				relays
			};
		} else if(prefix == nostrEncEntityPrefixes.nevent) {
			const tlv = parseTLV(data);
			if(!tlv[0]?.[0] || tlv[0][0].length !== 32) {
				return null;
			}
			const id = nobleCurves.utils.bytesToHex(tlv[0][0]);
			const relays = tlv[1] ? tlv[1].map(d => utf8Decoder.decode(d)) : [];
			const result = {
				prefix,
				hex: id,
				relays
			};
			if(tlv[2]) {
				result.author = nobleCurves.utils.bytesToHex(tlv[2][0]);
			}
			if(tlv[3]) {
				result.kind = toIntBigEndian(tlv[3][0]);
			}
			return result;
		}
		return {
			prefix,
			hex: nobleCurves.utils.bytesToHex(data)
		};
	}

	return Object.freeze({
		generatePrivateKey,
		isHash,
		isHashPrefix,
		getPublicKey,
		generateKeys,
		getAuthor,
		getDate,
		getTagValues,
		parseEQTags,
		verifyEvent,
		createEvent,
		testEvent,
		encodeEntity,
		decodeEntity
	});
}();


const nostrClient = function() {
	const relays = {};
	const sockets = {};
	const subscriptions = {};

	function getRelays() {
		return structuredClone(relays);
	}

	function noRelays() {
		return Object.keys(relays).length == 0;
	}

	function hasRelay(relay) {
		return relay in relays;
	}

	function* getSockets(mode) {
		for(const relay in relays) {
			const socket = sockets[relay];
			var cond = mode == "any" || relays[relay][mode];
			cond &&= (socket.readyState == WebSocket.OPEN || socket.readyState == WebSocket.CONNECTING);
			if(cond) {
				yield socket;
			}
		}
	}

	function checkEventExists(filters, filterFunc, maxTime) {
		maxTime ||= 100000;
		var subId;
		const p1 = new Promise(resolve => {
			subId = createSubscription(filters, event => {
				if(!filterFunc || filterFunc(event)) {
					cancelSubscription(subId);
					resolve(true);
				}
			});
		});
		const p2 = timeout(maxTime).then(() => {
			cancelSubscription(subId);
			return false;
		});
		return Promise.race([p1, p2]);
	}

	function getReasonableTimestamp(partialFilters, current, delay, increment) {
		current ||= Math.round(Date.now() / 1000);
		delay ||= 100;
		increment ||= 60 * 30;
		return new Promise(async resolve => {
			var until = current + 1;
			var since = until - increment;
			var subIds = [];
			var loop = true;
			while(loop) {
				const filters = {
					...partialFilters,
					since,
					until
				};
				const subId = createSubscription(filters, event => {
					for(const subId of subIds) {
						cancelSubscription(subId);
					}
					resolve(since);
					loop = false;
				});
				subIds.push(subId);
				await timeout(delay);
				increment *= 2;
				until = since + 1;
				since = until - increment;
			}
		});
	}

	function normalizeRelay(relay) {
		return new URL(relay).href;
	}

	function createSocket(relay) {
		const socket = new WebSocket(relay);
		socket.addEventListener("message", async e => {
			const message = JSON.parse(e.data);
			const type = message[0];
			if(type == "EVENT") {
				const subId = message[1];
				const event = Object.freeze(message[2]);
				if(!await nostrUtils.verifyEvent(event)) return;
				if(!(subId in subscriptions)) return;
				subscriptions[subId].callback(event);
			} else if(type == "EOSE") {
				const subId = message[1];
				if(!(subId in subscriptions)) return;
				const index = subscriptions[subId].sockets.indexOf(socket);
				if(index < 0) return;
				subscriptions[subId].sockets.splice(index, 1);
			}
		});
		return socket;
	}

	function addRelay(relay, read, write) {
		relay = normalizeRelay(relay);
		read = !!read;
		write = !!write;
		if(relays[relay]) {
			relays[relay].read ||= read;
			relays[relay].write ||= write;
		} else {
			relays[relay] = {
				read,
				write
			};
		}
		if(relays[relay].read || relays[relay].write) {
			if(!sockets[relay]) {
				sockets[relay] = createSocket(relay);
			}
		} else {
			sockets[relay] = null;
		}
	}

	function setRelay(relay, read, write) {
		relay = normalizeRelay(relay);
		read = !!read;
		write = !!write;
		relays[relay] = {
			read,
			write
		};
		if(read || write) {
			if(!sockets[relay]) {
				sockets[relay] = createSocket(relay);
			}
		} else {
			if(sockets[relay]) {
				sockets[relay].close();
				sockets[relay] = null;
			}
		}
	}

	function removeRelay(relay) {
		relay = normalizeRelay(relay);
		if(!(relay in relays)) {
			return false;
		}
		delete relays[relay];
		if(sockets[relay]) {
			sockets[relay].close();
		}
		delete sockets[relay];
		return true;
	}

	function waitSocketOpen(socket) {
		return new Promise(resolve => {
			socket.addEventListener("open", async () => {
				resolve();
			});
		});
	}

	async function sendToSocket(socket, message) {
		if(socket.readyState == WebSocket.CONNECTING) {
			await waitSocketOpen(socket);
		}
		return await socket.send(message);
	}

	function sendToSockets(message, mode, socketsOut) {
		message = JSON.stringify(message);
		const requests = [];
		for(const socket of getSockets(mode)) {
			if(socketsOut) {
				socketsOut.push(socket);
			}
			requests.push(sendToSocket(socket, message));
		}
		return requests;
	}

	function sendToChosenSockets(message, sockets) {
		message = JSON.stringify(message);
		const requests = [];
		for(const socket of sockets) {
			if(socket.readyState == WebSocket.OPEN || socket.readyState == WebSocket.CONNECTING) {
				requests.push(sendToSocket(socket, message));
			}
		}
		return requests;
	}

	function generateSubId() {
		return crypto.randomUUID();
	}

	function cancelSubscription(id) {
		if(id in subscriptions) {
			const message = ["CLOSE", id];
			sendToChosenSockets(message, subscriptions[id].sockets);
			delete subscriptions[id];
		}
	}

	function createSubscription(filters, callback, mode, subId) {
		mode ||= "read";
		subId ||= generateSubId();
		const message = ["REQ", subId, filters];
		const sockets = [];
		sendToSockets(message, mode, sockets);
		subscriptions[subId] = {
			callback: event => {
				if(nostrUtils.testEvent(filters, event)) {
					callback(event);
				}
			},
			sockets
		};
		return subId;
	}

	function fetchOne(filters, mode) {
		mode ||= "read";
		return new Promise(resolve => {
			const subId = createSubscription(filters, event => {
				cancelSubscription(subId);
				resolve(event);
			}, mode);
		});
	}

	function fetchMostRecent(filters, mode, maxTime) {
		mode ||= "read";
		maxTime = 10000;
		var beginTime = Date.now();
		var subId;
		const p1 = new Promise(resolve => {
			var recentEvent = null;
			subId = createSubscription(filters, event => {
				if(recentEvent) {
					if(event.created_at > recentEvent.created_at) {
						recentEvent = event;
					}
				} else {
					recentEvent = event;
					var delay = Date.now() - beginTime;
					delay *= 2;
					timeout(delay).then(() => {
						cancelSubscription(subId);
						resolve(recentEvent);
					});
				}
			}, mode);
		});
		const p2 = timeout(maxTime).then(() => cancelSubscription(subId));
		return Promise.race([p1, p2]);
	}

	function fetchUserMetadata(pubkey, callback, maxTime) {
		maxTime ||= 3000;
		const filters = {
			authors: [pubkey],
			kinds: [nostrEventKinds.user_metadata],
			limit: 1
		};
		var timestamp;
		const subId = createSubscription(filters, event => {
			if(!timestamp || event.created_at > timestamp) {
				const metadata = JSON.parse(event.content);
				timestamp = event.created_at;
				callback(event.pubkey, Object.freeze(metadata));
			}
		});
		timeout(maxTime).then(() => cancelSubscription(subId));
	}

	function fetchUserMetadataSubarray(subarray, callback, maxTime) {
		const filters = {
			authors: subarray,
			kinds: [nostrEventKinds.user_metadata]
		};
		const timestamps = {};
		var nextStep;
		const p1 = new Promise(resolve => nextStep = resolve);
		const subId = createSubscription(filters, event => {
			if(nextStep) {
				nextStep();
				nextStep = null;
			}
			if(!timestamps[event.pubkey] || event.created_at > timestamps[event.pubkey]) {
				const metadata = JSON.parse(event.content);
				timestamps[event.pubkey] = event.created_at;
				const user = subarray.find(pubkey => event.pubkey.startsWith(pubkey));
				callback(user, event.pubkey, Object.freeze(metadata));
			}
		});
		timeout(maxTime).then(() => {
			if(nextStep) {
				nextStep();
				nextStep = null;
			}
			cancelSubscription(subId);
		});
		return p1;
	}

	async function fetchUsersMetadata(pubkeys, callback, maxTime) {
		maxTime ||= 10000;
		pubkeys = [...pubkeys];
		if(pubkeys.length > 32) {
			for(var i = 0; i < pubkeys.length; i += 64) {
				const subarray = pubkeys.slice(i, i + 64);
				await fetchUserMetadataSubarray(subarray, callback, maxTime);
				if(i + 64 < pubkeys.length) {
					await timeout(1500);
				}
			}
		} else {
			await fetchUserMetadataSubarray(pubkeys, callback, maxTime);
		}
	}

	function fetchFeed(filters, callback, mode, subId) {
		mode ||= "read";
		const collectedIds = [];
		subId = createSubscription(filters, event => {
			if(!collectedIds.includes(event.id)) {
				collectedIds.push(event.id);
				callback(event);
			}
		}, mode, subId);
		return subId;
	}

	async function postNote(keys, content, tags) {
		const kind = nostrEventKinds.text_note;
		tags ||= [];
		const event = await nostrUtils.createEvent(keys, kind, tags, content);
		const requests = sendEvent(event);
		await Promise.any(requests);
		const filters = {
			ids: [event.id],
			limit: 1
		};
		await fetchOne(filters, "write");
		return event;
	}

	async function repostNote(keys, note) {
		const kind = nostrEventKinds.repost;
		const tags = [
			["e", note.id],
			["p", note.pubkey]
		];
		const content = JSON.stringify(note);
		const event = await nostrUtils.createEvent(keys, kind, tags, content);
		const requests = sendEvent(event);
		await Promise.any(requests);
		const filters = {
			ids: [event.id],
			limit: 1
		};
		await fetchOne(filters, "write");
		return event;
	}

	async function postContacts(keys, tags) {
		const kind = nostrEventKinds.follows;
		const event = await nostrUtils.createEvent(keys, kind, tags, "");
		const requests = sendEvent(event);
		await Promise.any(requests);
		const filters = {
			ids: [event.id],
			limit: 1
		};
		await fetchOne(filters, "write");
		return event;
	}

	async function setMetadata(keys, metadata) {
		const kind = nostrEventKinds.user_metadata;
		const content = JSON.stringify(metadata);
		const event = await nostrUtils.createEvent(keys, kind, [], content);
		const requests = sendEvent(event);
		await Promise.any(requests);
		const filters = {
			ids: [event.id],
			limit: 1
		};
		await fetchOne(filters, "write");
		return event;
	}

	function sendEvent(event) {
		const message = ["EVENT", event];
		const requests = sendToSockets(message, "write");
		return requests;
	}

	return Object.freeze({
		checkEventExists,
		getReasonableTimestamp,
		getRelays,
		noRelays,
		hasRelay,
		addRelay,
		setRelay,
		removeRelay,
		fetchFeed,
		fetchOne,
		fetchMostRecent,
		cancelSubscription,
		fetchUserMetadata,
		fetchUsersMetadata,
		postNote,
		repostNote,
		postContacts,
		setMetadata
	});
}();


const gatherNostrRelays = function() {
	async function fromNostrInfo() {
		const resource = "https://raw.githubusercontent.com/Giszmo/nostr.info/a549f24d1961c4f6e8fdaec3b4b159ad6d9e50a1/_data/relays.yml";
		const document = await (await fetch(resource)).text();
		var rx = /wss:(.*)$/s;
		var arr = rx.exec(document);
		var list = arr[1];
		var urls = [];
		rx = /^.*\-\s+(\S+)\s*$/igm;
		var m;
		while(m = rx.exec(list)) {
			const url = "wss://" + m[1] + "/";
			const relay = new URL(url).href;
			urls.push(relay);
		}
		console.log("urls:" + urls.length);
		return urls;
	}

	async function fromNostrWatch() {
		const resource = "https://raw.githubusercontent.com/dskvr/nostr-watch/develop/relays.yaml";
		const document = await (await fetch(resource)).text();
		var rx = /relays:(.*)$/s;
		var arr = rx.exec(document);
		var list = arr[1];
		var urls = [];
		rx = /^.*\-.+(wss:\/\/\S+)\s*$/igm;
		var m;
		while(m = rx.exec(list)) {
			const relay = new URL(m[1]).href;
			urls.push(relay);
		}
		console.log("urls:" + urls.length);
		return urls;
	}

	function connect(relay) {
		const socket = new WebSocket(relay);
		return new Promise(resolve => {
			socket.addEventListener("open", () => resolve(socket));
		});
	}

	function receiveEvent(socket, subId) {
		return new Promise(resolve => {
			socket.addEventListener("message", async e => {
				const message = JSON.parse(e.data);
				const type = message[0];
				if(type == "EVENT" && message[1] == subId) {
					const event = Object.freeze(message[2]);
					if(await nostrUtils.verifyEvent(event)) {
						resolve(event);
					}
				}
			});
			socket.addEventListener("error", e => {
				resolve(null);
			});
		});
	}

	async function testRelay(event, relay, subId) {
		const socket = await connect(relay);
		var message = ["EVENT", event];
		message = JSON.stringify(message);
		await socket.send(message);
		const filters = { ids: [event.id] };
		message = ["REQ", subId, filters];
		message = JSON.stringify(message);
		socket.send(message);
		const received = await receiveEvent(socket, subId);
		if(received && received.id == event.id) {
			return socket.url;
		}
		return null;
	}

	function testRelayLimited(event, relay, subId) {
		const promise1 = timeout(30000);
		const promise2 = testRelay(event, relay, subId);
		const result = Promise.race([promise1, promise2]);
		return result;
	}

	function testRelays(relays, event, subId) {
		const tests = relays.map(relay => testRelayLimited(event, relay, subId));
		const results = Promise.all(tests);
		return results;
	}

	return async function() {
		const relays1 = await fromNostrInfo();
		const relays2 = await fromNostrWatch();
		var relays = relays1.filter(relay => relays2.includes(relay));
		const keys = nostrUtils.generateKeys();
		const event = await nostrUtils.createEvent(keys, 1, [], "Demo.");
		const subId = crypto.randomUUID();
		const tests = await testRelays(relays, event, subId);
		relays = tests.filter(relay => relay);
		relays.sort();
		return relays;
	}
}();
