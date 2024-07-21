(() => {
  var __defProp = Object.defineProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // node_modules/@scure/base/lib/esm/index.js
  var esm_exports = {};
  __export(esm_exports, {
    assertNumber: () => assertNumber,
    base16: () => base16,
    base32: () => base32,
    base32crockford: () => base32crockford,
    base32hex: () => base32hex,
    base32hexnopad: () => base32hexnopad,
    base32nopad: () => base32nopad,
    base58: () => base58,
    base58check: () => base58check,
    base58flickr: () => base58flickr,
    base58xmr: () => base58xmr,
    base58xrp: () => base58xrp,
    base64: () => base64,
    base64nopad: () => base64nopad,
    base64url: () => base64url,
    base64urlnopad: () => base64urlnopad,
    bech32: () => bech32,
    bech32m: () => bech32m,
    bytes: () => bytes,
    bytesToString: () => bytesToString,
    createBase58check: () => createBase58check,
    hex: () => hex,
    str: () => str,
    stringToBytes: () => stringToBytes,
    utf8: () => utf8,
    utils: () => utils
  });
  // @__NO_SIDE_EFFECTS__
  function assertNumber(n) {
    if (!Number.isSafeInteger(n))
      throw new Error(`Wrong integer: ${n}`);
  }
  function isBytes(a) {
    return a instanceof Uint8Array || a != null && typeof a === "object" && a.constructor.name === "Uint8Array";
  }
  // @__NO_SIDE_EFFECTS__
  function chain(...args) {
    const id = (a) => a;
    const wrap = (a, b) => (c) => a(b(c));
    const encode = args.map((x) => x.encode).reduceRight(wrap, id);
    const decode = args.map((x) => x.decode).reduce(wrap, id);
    return { encode, decode };
  }
  // @__NO_SIDE_EFFECTS__
  function alphabet(alphabet2) {
    return {
      encode: (digits) => {
        if (!Array.isArray(digits) || digits.length && typeof digits[0] !== "number")
          throw new Error("alphabet.encode input should be an array of numbers");
        return digits.map((i) => {
          /* @__PURE__ */ assertNumber(i);
          if (i < 0 || i >= alphabet2.length)
            throw new Error(`Digit index outside alphabet: ${i} (alphabet: ${alphabet2.length})`);
          return alphabet2[i];
        });
      },
      decode: (input) => {
        if (!Array.isArray(input) || input.length && typeof input[0] !== "string")
          throw new Error("alphabet.decode input should be array of strings");
        return input.map((letter) => {
          if (typeof letter !== "string")
            throw new Error(`alphabet.decode: not string element=${letter}`);
          const index = alphabet2.indexOf(letter);
          if (index === -1)
            throw new Error(`Unknown letter: "${letter}". Allowed: ${alphabet2}`);
          return index;
        });
      }
    };
  }
  // @__NO_SIDE_EFFECTS__
  function join(separator = "") {
    if (typeof separator !== "string")
      throw new Error("join separator should be string");
    return {
      encode: (from) => {
        if (!Array.isArray(from) || from.length && typeof from[0] !== "string")
          throw new Error("join.encode input should be array of strings");
        for (let i of from)
          if (typeof i !== "string")
            throw new Error(`join.encode: non-string input=${i}`);
        return from.join(separator);
      },
      decode: (to) => {
        if (typeof to !== "string")
          throw new Error("join.decode input should be string");
        return to.split(separator);
      }
    };
  }
  // @__NO_SIDE_EFFECTS__
  function padding(bits, chr = "=") {
    /* @__PURE__ */ assertNumber(bits);
    if (typeof chr !== "string")
      throw new Error("padding chr should be string");
    return {
      encode(data) {
        if (!Array.isArray(data) || data.length && typeof data[0] !== "string")
          throw new Error("padding.encode input should be array of strings");
        for (let i of data)
          if (typeof i !== "string")
            throw new Error(`padding.encode: non-string input=${i}`);
        while (data.length * bits % 8)
          data.push(chr);
        return data;
      },
      decode(input) {
        if (!Array.isArray(input) || input.length && typeof input[0] !== "string")
          throw new Error("padding.encode input should be array of strings");
        for (let i of input)
          if (typeof i !== "string")
            throw new Error(`padding.decode: non-string input=${i}`);
        let end = input.length;
        if (end * bits % 8)
          throw new Error("Invalid padding: string should have whole number of bytes");
        for (; end > 0 && input[end - 1] === chr; end--) {
          if (!((end - 1) * bits % 8))
            throw new Error("Invalid padding: string has too much padding");
        }
        return input.slice(0, end);
      }
    };
  }
  // @__NO_SIDE_EFFECTS__
  function normalize(fn) {
    if (typeof fn !== "function")
      throw new Error("normalize fn should be function");
    return { encode: (from) => from, decode: (to) => fn(to) };
  }
  // @__NO_SIDE_EFFECTS__
  function convertRadix(data, from, to) {
    if (from < 2)
      throw new Error(`convertRadix: wrong from=${from}, base cannot be less than 2`);
    if (to < 2)
      throw new Error(`convertRadix: wrong to=${to}, base cannot be less than 2`);
    if (!Array.isArray(data))
      throw new Error("convertRadix: data should be array");
    if (!data.length)
      return [];
    let pos = 0;
    const res = [];
    const digits = Array.from(data);
    digits.forEach((d) => {
      /* @__PURE__ */ assertNumber(d);
      if (d < 0 || d >= from)
        throw new Error(`Wrong integer: ${d}`);
    });
    while (true) {
      let carry = 0;
      let done = true;
      for (let i = pos; i < digits.length; i++) {
        const digit = digits[i];
        const digitBase = from * carry + digit;
        if (!Number.isSafeInteger(digitBase) || from * carry / from !== carry || digitBase - digit !== from * carry) {
          throw new Error("convertRadix: carry overflow");
        }
        carry = digitBase % to;
        const rounded = Math.floor(digitBase / to);
        digits[i] = rounded;
        if (!Number.isSafeInteger(rounded) || rounded * to + carry !== digitBase)
          throw new Error("convertRadix: carry overflow");
        if (!done)
          continue;
        else if (!rounded)
          pos = i;
        else
          done = false;
      }
      res.push(carry);
      if (done)
        break;
    }
    for (let i = 0; i < data.length - 1 && data[i] === 0; i++)
      res.push(0);
    return res.reverse();
  }
  var gcd = /* @__NO_SIDE_EFFECTS__ */ (a, b) => !b ? a : /* @__PURE__ */ gcd(b, a % b);
  var radix2carry = /* @__NO_SIDE_EFFECTS__ */ (from, to) => from + (to - /* @__PURE__ */ gcd(from, to));
  // @__NO_SIDE_EFFECTS__
  function convertRadix2(data, from, to, padding2) {
    if (!Array.isArray(data))
      throw new Error("convertRadix2: data should be array");
    if (from <= 0 || from > 32)
      throw new Error(`convertRadix2: wrong from=${from}`);
    if (to <= 0 || to > 32)
      throw new Error(`convertRadix2: wrong to=${to}`);
    if (/* @__PURE__ */ radix2carry(from, to) > 32) {
      throw new Error(`convertRadix2: carry overflow from=${from} to=${to} carryBits=${/* @__PURE__ */ radix2carry(from, to)}`);
    }
    let carry = 0;
    let pos = 0;
    const mask = 2 ** to - 1;
    const res = [];
    for (const n of data) {
      /* @__PURE__ */ assertNumber(n);
      if (n >= 2 ** from)
        throw new Error(`convertRadix2: invalid data word=${n} from=${from}`);
      carry = carry << from | n;
      if (pos + from > 32)
        throw new Error(`convertRadix2: carry overflow pos=${pos} from=${from}`);
      pos += from;
      for (; pos >= to; pos -= to)
        res.push((carry >> pos - to & mask) >>> 0);
      carry &= 2 ** pos - 1;
    }
    carry = carry << to - pos & mask;
    if (!padding2 && pos >= from)
      throw new Error("Excess padding");
    if (!padding2 && carry)
      throw new Error(`Non-zero padding: ${carry}`);
    if (padding2 && pos > 0)
      res.push(carry >>> 0);
    return res;
  }
  // @__NO_SIDE_EFFECTS__
  function radix(num) {
    /* @__PURE__ */ assertNumber(num);
    return {
      encode: (bytes2) => {
        if (!isBytes(bytes2))
          throw new Error("radix.encode input should be Uint8Array");
        return /* @__PURE__ */ convertRadix(Array.from(bytes2), 2 ** 8, num);
      },
      decode: (digits) => {
        if (!Array.isArray(digits) || digits.length && typeof digits[0] !== "number")
          throw new Error("radix.decode input should be array of numbers");
        return Uint8Array.from(/* @__PURE__ */ convertRadix(digits, num, 2 ** 8));
      }
    };
  }
  // @__NO_SIDE_EFFECTS__
  function radix2(bits, revPadding = false) {
    /* @__PURE__ */ assertNumber(bits);
    if (bits <= 0 || bits > 32)
      throw new Error("radix2: bits should be in (0..32]");
    if (/* @__PURE__ */ radix2carry(8, bits) > 32 || /* @__PURE__ */ radix2carry(bits, 8) > 32)
      throw new Error("radix2: carry overflow");
    return {
      encode: (bytes2) => {
        if (!isBytes(bytes2))
          throw new Error("radix2.encode input should be Uint8Array");
        return /* @__PURE__ */ convertRadix2(Array.from(bytes2), 8, bits, !revPadding);
      },
      decode: (digits) => {
        if (!Array.isArray(digits) || digits.length && typeof digits[0] !== "number")
          throw new Error("radix2.decode input should be array of numbers");
        return Uint8Array.from(/* @__PURE__ */ convertRadix2(digits, bits, 8, revPadding));
      }
    };
  }
  // @__NO_SIDE_EFFECTS__
  function unsafeWrapper(fn) {
    if (typeof fn !== "function")
      throw new Error("unsafeWrapper fn should be function");
    return function(...args) {
      try {
        return fn.apply(null, args);
      } catch (e) {
      }
    };
  }
  // @__NO_SIDE_EFFECTS__
  function checksum(len, fn) {
    /* @__PURE__ */ assertNumber(len);
    if (typeof fn !== "function")
      throw new Error("checksum fn should be function");
    return {
      encode(data) {
        if (!isBytes(data))
          throw new Error("checksum.encode: input should be Uint8Array");
        const checksum2 = fn(data).slice(0, len);
        const res = new Uint8Array(data.length + len);
        res.set(data);
        res.set(checksum2, data.length);
        return res;
      },
      decode(data) {
        if (!isBytes(data))
          throw new Error("checksum.decode: input should be Uint8Array");
        const payload = data.slice(0, -len);
        const newChecksum = fn(payload).slice(0, len);
        const oldChecksum = data.slice(-len);
        for (let i = 0; i < len; i++)
          if (newChecksum[i] !== oldChecksum[i])
            throw new Error("Invalid checksum");
        return payload;
      }
    };
  }
  var utils = {
    alphabet,
    chain,
    checksum,
    convertRadix,
    convertRadix2,
    radix,
    radix2,
    join,
    padding
  };
  var base16 = /* @__PURE__ */ chain(/* @__PURE__ */ radix2(4), /* @__PURE__ */ alphabet("0123456789ABCDEF"), /* @__PURE__ */ join(""));
  var base32 = /* @__PURE__ */ chain(/* @__PURE__ */ radix2(5), /* @__PURE__ */ alphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"), /* @__PURE__ */ padding(5), /* @__PURE__ */ join(""));
  var base32nopad = /* @__PURE__ */ chain(/* @__PURE__ */ radix2(5), /* @__PURE__ */ alphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"), /* @__PURE__ */ join(""));
  var base32hex = /* @__PURE__ */ chain(/* @__PURE__ */ radix2(5), /* @__PURE__ */ alphabet("0123456789ABCDEFGHIJKLMNOPQRSTUV"), /* @__PURE__ */ padding(5), /* @__PURE__ */ join(""));
  var base32hexnopad = /* @__PURE__ */ chain(/* @__PURE__ */ radix2(5), /* @__PURE__ */ alphabet("0123456789ABCDEFGHIJKLMNOPQRSTUV"), /* @__PURE__ */ join(""));
  var base32crockford = /* @__PURE__ */ chain(/* @__PURE__ */ radix2(5), /* @__PURE__ */ alphabet("0123456789ABCDEFGHJKMNPQRSTVWXYZ"), /* @__PURE__ */ join(""), /* @__PURE__ */ normalize((s) => s.toUpperCase().replace(/O/g, "0").replace(/[IL]/g, "1")));
  var base64 = /* @__PURE__ */ chain(/* @__PURE__ */ radix2(6), /* @__PURE__ */ alphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"), /* @__PURE__ */ padding(6), /* @__PURE__ */ join(""));
  var base64nopad = /* @__PURE__ */ chain(/* @__PURE__ */ radix2(6), /* @__PURE__ */ alphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"), /* @__PURE__ */ join(""));
  var base64url = /* @__PURE__ */ chain(/* @__PURE__ */ radix2(6), /* @__PURE__ */ alphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"), /* @__PURE__ */ padding(6), /* @__PURE__ */ join(""));
  var base64urlnopad = /* @__PURE__ */ chain(/* @__PURE__ */ radix2(6), /* @__PURE__ */ alphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"), /* @__PURE__ */ join(""));
  var genBase58 = (abc) => /* @__PURE__ */ chain(/* @__PURE__ */ radix(58), /* @__PURE__ */ alphabet(abc), /* @__PURE__ */ join(""));
  var base58 = /* @__PURE__ */ genBase58("123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz");
  var base58flickr = /* @__PURE__ */ genBase58("123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ");
  var base58xrp = /* @__PURE__ */ genBase58("rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz");
  var XMR_BLOCK_LEN = [0, 2, 3, 5, 6, 7, 9, 10, 11];
  var base58xmr = {
    encode(data) {
      let res = "";
      for (let i = 0; i < data.length; i += 8) {
        const block = data.subarray(i, i + 8);
        res += base58.encode(block).padStart(XMR_BLOCK_LEN[block.length], "1");
      }
      return res;
    },
    decode(str2) {
      let res = [];
      for (let i = 0; i < str2.length; i += 11) {
        const slice = str2.slice(i, i + 11);
        const blockLen = XMR_BLOCK_LEN.indexOf(slice.length);
        const block = base58.decode(slice);
        for (let j = 0; j < block.length - blockLen; j++) {
          if (block[j] !== 0)
            throw new Error("base58xmr: wrong padding");
        }
        res = res.concat(Array.from(block.slice(block.length - blockLen)));
      }
      return Uint8Array.from(res);
    }
  };
  var createBase58check = (sha256) => /* @__PURE__ */ chain(/* @__PURE__ */ checksum(4, (data) => sha256(sha256(data))), base58);
  var base58check = createBase58check;
  var BECH_ALPHABET = /* @__PURE__ */ chain(/* @__PURE__ */ alphabet("qpzry9x8gf2tvdw0s3jn54khce6mua7l"), /* @__PURE__ */ join(""));
  var POLYMOD_GENERATORS = [996825010, 642813549, 513874426, 1027748829, 705979059];
  // @__NO_SIDE_EFFECTS__
  function bech32Polymod(pre) {
    const b = pre >> 25;
    let chk = (pre & 33554431) << 5;
    for (let i = 0; i < POLYMOD_GENERATORS.length; i++) {
      if ((b >> i & 1) === 1)
        chk ^= POLYMOD_GENERATORS[i];
    }
    return chk;
  }
  // @__NO_SIDE_EFFECTS__
  function bechChecksum(prefix, words, encodingConst = 1) {
    const len = prefix.length;
    let chk = 1;
    for (let i = 0; i < len; i++) {
      const c = prefix.charCodeAt(i);
      if (c < 33 || c > 126)
        throw new Error(`Invalid prefix (${prefix})`);
      chk = /* @__PURE__ */ bech32Polymod(chk) ^ c >> 5;
    }
    chk = /* @__PURE__ */ bech32Polymod(chk);
    for (let i = 0; i < len; i++)
      chk = /* @__PURE__ */ bech32Polymod(chk) ^ prefix.charCodeAt(i) & 31;
    for (let v of words)
      chk = /* @__PURE__ */ bech32Polymod(chk) ^ v;
    for (let i = 0; i < 6; i++)
      chk = /* @__PURE__ */ bech32Polymod(chk);
    chk ^= encodingConst;
    return BECH_ALPHABET.encode(/* @__PURE__ */ convertRadix2([chk % 2 ** 30], 30, 5, false));
  }
  // @__NO_SIDE_EFFECTS__
  function genBech32(encoding) {
    const ENCODING_CONST = encoding === "bech32" ? 1 : 734539939;
    const _words = /* @__PURE__ */ radix2(5);
    const fromWords = _words.decode;
    const toWords = _words.encode;
    const fromWordsUnsafe = /* @__PURE__ */ unsafeWrapper(fromWords);
    function encode(prefix, words, limit = 90) {
      if (typeof prefix !== "string")
        throw new Error(`bech32.encode prefix should be string, not ${typeof prefix}`);
      if (!Array.isArray(words) || words.length && typeof words[0] !== "number")
        throw new Error(`bech32.encode words should be array of numbers, not ${typeof words}`);
      if (prefix.length === 0)
        throw new TypeError(`Invalid prefix length ${prefix.length}`);
      const actualLength = prefix.length + 7 + words.length;
      if (limit !== false && actualLength > limit)
        throw new TypeError(`Length ${actualLength} exceeds limit ${limit}`);
      const lowered = prefix.toLowerCase();
      const sum = /* @__PURE__ */ bechChecksum(lowered, words, ENCODING_CONST);
      return `${lowered}1${BECH_ALPHABET.encode(words)}${sum}`;
    }
    function decode(str2, limit = 90) {
      if (typeof str2 !== "string")
        throw new Error(`bech32.decode input should be string, not ${typeof str2}`);
      if (str2.length < 8 || limit !== false && str2.length > limit)
        throw new TypeError(`Wrong string length: ${str2.length} (${str2}). Expected (8..${limit})`);
      const lowered = str2.toLowerCase();
      if (str2 !== lowered && str2 !== str2.toUpperCase())
        throw new Error(`String must be lowercase or uppercase`);
      const sepIndex = lowered.lastIndexOf("1");
      if (sepIndex === 0 || sepIndex === -1)
        throw new Error(`Letter "1" must be present between prefix and data only`);
      const prefix = lowered.slice(0, sepIndex);
      const data = lowered.slice(sepIndex + 1);
      if (data.length < 6)
        throw new Error("Data must be at least 6 characters long");
      const words = BECH_ALPHABET.decode(data).slice(0, -6);
      const sum = /* @__PURE__ */ bechChecksum(prefix, words, ENCODING_CONST);
      if (!data.endsWith(sum))
        throw new Error(`Invalid checksum in ${str2}: expected "${sum}"`);
      return { prefix, words };
    }
    const decodeUnsafe = /* @__PURE__ */ unsafeWrapper(decode);
    function decodeToBytes(str2) {
      const { prefix, words } = decode(str2, false);
      return { prefix, words, bytes: fromWords(words) };
    }
    return { encode, decode, decodeToBytes, decodeUnsafe, fromWords, fromWordsUnsafe, toWords };
  }
  var bech32 = /* @__PURE__ */ genBech32("bech32");
  var bech32m = /* @__PURE__ */ genBech32("bech32m");
  var utf8 = {
    encode: (data) => new TextDecoder().decode(data),
    decode: (str2) => new TextEncoder().encode(str2)
  };
  var hex = /* @__PURE__ */ chain(/* @__PURE__ */ radix2(4), /* @__PURE__ */ alphabet("0123456789abcdef"), /* @__PURE__ */ join(""), /* @__PURE__ */ normalize((s) => {
    if (typeof s !== "string" || s.length % 2)
      throw new TypeError(`hex.decode: expected string, got ${typeof s} with length ${s.length}`);
    return s.toLowerCase();
  }));
  var CODERS = {
    utf8,
    hex,
    base16,
    base32,
    base64,
    base64url,
    base58,
    base58xmr
  };
  var coderTypeError = "Invalid encoding type. Available types: utf8, hex, base16, base32, base64, base64url, base58, base58xmr";
  var bytesToString = (type, bytes2) => {
    if (typeof type !== "string" || !CODERS.hasOwnProperty(type))
      throw new TypeError(coderTypeError);
    if (!isBytes(bytes2))
      throw new TypeError("bytesToString() expects Uint8Array");
    return CODERS[type].encode(bytes2);
  };
  var str = bytesToString;
  var stringToBytes = (type, str2) => {
    if (!CODERS.hasOwnProperty(type))
      throw new TypeError(coderTypeError);
    if (typeof str2 !== "string")
      throw new TypeError("stringToBytes() expects string");
    return CODERS[type].decode(str2);
  };
  var bytes = stringToBytes;

  // scure-base.js
  var scure_base_default = esm_exports;
  window.scureBase = esm_exports;
})();
/*! Bundled license information:

@scure/base/lib/esm/index.js:
  (*! scure-base - MIT License (c) 2022 Paul Miller (paulmillr.com) *)
*/
