// Thanks https://gist.github.com/devsnek/77275f6e3f810a9545440931ed314dc1

const hex2bin = hex => {
    const buf = new Uint8Array(Math.ceil(hex.length / 2));
    for (let i = 0; i < buf.length; i++) {
        buf[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return buf;
};

/**
 * Import a hex-encoded key into a CryptoKey
 *
 * @param {string} key Hex-encoded key
 * @returns {Promise<CryptoKey>}
 */
export const importKey = key => crypto.subtle.importKey(
    'raw',
    hex2bin(key),
    {
        name: 'NODE-ED25519',
        namedCurve: 'NODE-ED25519',
        public: true,
    },
    true,
    ['verify'],
);

const encoder = new TextEncoder();

/**
 * Verify a request from Discord
 *
 * @param {Request} request Request to verify
 * @param {string} bodyText Body text of the request
 * @param {CryptoKey} publicKey Public key to verify with
 * @returns {Promise<boolean>}
 */
const verifyRequest = (request, bodyText, publicKey) => {
    const timestamp = request.headers.get('X-Signature-Timestamp') || '';
    const signature = hex2bin(request.headers.get('X-Signature-Ed25519'));
    return crypto.subtle.verify(
        'NODE-ED25519',
        publicKey,
        signature,
        encoder.encode(timestamp + bodyText),
    );
};

export default verifyRequest;
