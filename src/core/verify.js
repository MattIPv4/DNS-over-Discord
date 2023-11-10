// Thanks https://gist.github.com/devsnek/77275f6e3f810a9545440931ed314dc1

const hex2bin = hex => {
    const buf = new Uint8Array(Math.ceil(hex.length / 2));
    for (let i = 0; i < buf.length; i++) {
        buf[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return buf;
};

const PUBLIC_KEY = crypto.subtle.importKey(
    'raw',
    hex2bin(process.env.CLIENT_PUBLIC_KEY),
    {
        name: 'NODE-ED25519',
        namedCurve: 'NODE-ED25519',
        public: true,
    },
    true,
    ['verify'],
);

const encoder = new TextEncoder();

export default async (request, bodyText) => {
    const timestamp = request.headers.get('X-Signature-Timestamp') || '';
    const signature = hex2bin(request.headers.get('X-Signature-Ed25519'));
    return crypto.subtle.verify(
        'NODE-ED25519',
        await PUBLIC_KEY,
        signature,
        encoder.encode(timestamp + bodyText),
    );
};
