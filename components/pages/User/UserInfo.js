import UsersCache from "../../UsersCache.js"

export default {
	props: {
		pubkey: String,
		metadata: Object
	},

	computed: {
		nPubKey() {
			if(this.pubkey) {
				return nostrUtils.encodeEntity(nostrEncEntityPrefixes.npub, this.pubkey);
			}
		}
	},

	template:`
	<dl>
		<template v-if="metadata?.name">
			<dt>Username</dt>
			<dd>{{ metadata.name }}</dd>
		</template>
		<template v-if="metadata?.about">
			<dt>About</dt>
			<dd class="about-info">{{ metadata.about }}</dd>
		</template>
		<template v-if="pubkey">
			<dt>Hex PubKey</dt>
			<dd class="user-pubkey">{{ pubkey }}</dd>
		</template>
		<template v-if="nPubKey">
			<dt>nPubKey</dt>
			<dd class="user-pubkey">{{ nPubKey }}</dd>
		</template>
	</dl>
	`
}
