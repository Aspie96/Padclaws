import LinkView from "../../LinkView.js"
import Session from "../../../js/session.js"
import TextView from "../../TextView.js"

export default {
	props: {
		pubkey: String,
		metadata: Object
	},

	computed: {
		selfUser() {
			return Session.logged && Session.userKeys.public.startsWith(this.pubkey);
		},

		nPubKey() {
			if(this.pubkey) {
				return nostrUtils.encodeEntity(nostrEncEntityPrefixes.npub, this.pubkey);
			}
		}
	},

	components: {
		LinkView,
		TextView
	},

	template:`
	<dl>
		<template v-if="metadata?.name">
			<dt>Username</dt>
			<dd>{{ metadata.name }}</dd>
		</template>
		<template v-if="metadata?.display_name">
			<dt>Display name</dt>
			<dd>{{ metadata.display_name }}</dd>
		</template>
		<template v-if="metadata?.website">
			<dt>Website</dt>
			<dd>
				<LinkView :url="metadata.website" />
			</dd>
		</template>
		<template v-if="metadata?.about">
			<dt>About</dt>
			<dd class="about-info">
				<TextView :text="metadata.about" />
			</dd>
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
	<RouterLink v-if="selfUser" :to="{ name: 'settings-profile' }" class="user-page-btn">Edit profile</RouterLink>
	`
}
