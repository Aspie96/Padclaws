# Padclaws

Padclaws is a Web client for the [Nostr](https://github.com/nostr-protocol/nostr) protocol. Specifically, the "Padclaws" name may refer to, either:
- The Padclaws software.
- The official public instance of the Padclaws software hosted at https://padclaws.org/.

The Padclaws software is implemented as a single-page static website using [Vue](https://vuejs.org/). It's a simple folder of files. Hosting it requires nothing more than placing it behind any Web server. If hosting a public instance, make sure to set an appropriate [privacy policy](./docs/privacy.html).

Padclaws is still in a rather messy stage of early development. Sometimes it might even work a bit. It's to be considered an individual project: it should match the preferences of one person: Valentino Giudice.

## Functionalities

Padclaws is a client for [Nostr](https://github.com/nostr-protocol/nostr). Censorship-resistant social networking through the decentralized publishing of text notes is the main goal of both and [NIP-01](https://github.com/nostr-protocol/nips/blob/master/01.md) is their core specification.

Some additional functionalities are implemented, including:
- [Follow lists](https://github.com/nostr-protocol/nips/blob/master/02.md) (but without local petnames).
- [Encoded entities](https://github.com/nostr-protocol/nips/blob/master/19.md) and [Nostr URIs](https://github.com/nostr-protocol/nips/blob/master/21.md).
- Basic interactions, such as reposts, replies and mentions.

The following functionalities are planned or to be considered:
- [Direct messages](https://github.com/nostr-protocol/nips/blob/master/17.md).
- [Reactions](https://github.com/nostr-protocol/nips/blob/master/25.md) on notes.
- Autocomplete for mentions.
- Reddit-style moderated [communities](https://github.com/nostr-protocol/nips/blob/master/72.md).
- Modifiable Markdown [articles](https://github.com/nostr-protocol/nips/blob/master/23.md).
- Option to [hide others' name](https://njump.me/note1vedysr359wgm92xdyr77j8jea0ksfx8cq74ahey6sg4waygr6qnq0eedjz).
- Manifest file to make Padclaws into a progressive Web application.
- Event signing [delegation](https://github.com/nostr-protocol/nips/blob/master/26.md).
- Support for browser [extensions](https://github.com/nostr-protocol/nips/blob/master/07.md) (but login trough one's private key will still be allowed).
- [Outbox model](https://mikedilger.com/gossip-model/), but the inbox model of using a static relay list set by the user will still be the default.

The following functionalities will not be implemented:
- Anything that requires communicating with any server without being authorized to do so by the user. This includes DNS-based [identifiers](https://github.com/nostr-protocol/nips/blob/master/05.md) embedded images (including [custom emojis](https://github.com/nostr-protocol/nips/blob/master/30.md)).
- Anything to do with money or payments. This includes anything Bitcoin-related. It also includes [marketplaces](https://github.com/nostr-protocol/nips/blob/master/15.md).
- Anything which, generally, significantly breaks the design or is out of scope in a social client.

## Guidelines

In general, the design and development of Padcalws should follow the following guidelines:

- [Robustness](https://datatracker.ietf.org/doc/html/rfc761#section-2.10): Padclaws should comply with the latest version of the Nostr protocol in full and avoid deprecated practices, but expect that relays and other clients might not.
- Accessibility: Padclaws should be accessible to a wide range of people with disabilities, as well as usable in general. [WCAG](https://www.w3.org/TR/WCAG/) conformance at the AA level should be achieved.
- Privacy: Padclaws should not communicate with any server without being expressly instructed to do so by the user. No informations should be unexpectedly shared with any party.
- Security: Padclaws should be secure. Cryptographic libraries should be indepedently [audited](https://github.com/paulmillr/noble-curves#security).

## Third-party components

This software incorporates, in whole or in part, the following third-party assets:

- [Vue](https://vuejs.org/), version 3.4.32, from [unpkg](https://unpkg.com/browse/vue@3.4.32/dist/).
- [Vue Router](https://router.vuejs.org/), version 4.4.0, from [unpkg](https://unpkg.com/browse/vue-router@4.4.0/dist/).
- [noble-curves](https://github.com/paulmillr/noble-curves), version 1.4.2, from [GitHub releases](https://github.com/paulmillr/noble-curves/releases/tag/1.4.2).
- [scure-base](https://github.com/paulmillr/scure-base), version 1.1.7, bundled manually using [esbuild](https://esbuild.github.io/).
- [Regular Expression for URL validation](https://gist.github.com/dperini/729294), from the [GitHub gist](https://gist.github.com/dperini/729294).
- [Tabler Icons](https://tabler.io/icons), version 3.11.0, extracted from official [download](https://tabler.io/icons).
- [Atkinson Hyperlegible](https://brailleinstitute.org/freefont), from [Google Fonts](https://fonts.google.com/specimen/Atkinson+Hyperlegible).
- [Noto Color Emoji](https://fonts.google.com/noto/specimen/Noto+Color+Emoji), from the [GitHub repository](https://github.com/googlefonts/noto-emoji).
- [Programma](https://github.com/douglascrockford/Programma), from the [GitHub repository](https://github.com/douglascrockford/Programma).

Check the projects above for their licensing information.

## License

Excluding third-party assets (which are released under their repsective licenses), licenses and logos, this project is released under the [MIT license](./LICENSE.txt).

All rights to icons, logos and the "Padclaws" name are reserved to Valentino Giudice.

**This software is provided without warranty of any kind**, see the license for more information. Use at your own risk.
