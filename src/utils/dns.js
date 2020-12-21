const fetch = require('node-fetch');
const { table } = require('table');

module.exports.performLookup = async (domain, type) => {
    // Build the query URL
    const query = new URL('https://cloudflare-dns.com/dns-query');
    query.searchParams.set('name', domain);
    query.searchParams.set('type', type.toLowerCase());

    // Make our request to Cloudflare
    const res = await fetch(query.href, {
        headers: {
            Accept: 'application/dns-json',
        },
    });

    // Parse the response
    const { Status, Answer, Authority } = await res.json();

    // TODO: Handle bad status returned

    // Answer & Authority have same struct
    return Answer || Authority;
};

module.exports.ValidTypes = Object.freeze(['A', 'AAAA', 'CAA', 'CERT', 'CNAME', 'DNSKEY', 'DS', 'LOC', 'MX', 'NAPTR',
    'NS', 'PTR', 'SMIMEA', 'SPF', 'SRV', 'SSHFP', 'TLSA', 'TXT', 'URI']);

module.exports.presentData = data => {
    // Convert the DNS data to table rows
    const tableRows = [
        ['NAME', 'TTL', 'DATA'],
        ...data.map(({ name, TTL, data }) => [name, `${TTL.toLocaleString()}s`, data]),
    ];

    // Set the table to render inside borders only, and a horizontal line after the header row
    const tableConfig = {
        border: {
            topBody: '',
            topJoin: '',
            topLeft: '',
            topRight: '',

            bottomBody: '',
            bottomJoin: '',
            bottomLeft: '',
            bottomRight: '',

            bodyLeft: '',
            bodyRight: '',
            bodyJoin: '|',

            joinBody: '-',
            joinLeft: '',
            joinRight: '',
            joinJoin: '+'
        },
        drawHorizontalLine: index => index === 1,
    };

    // Render the table
    return table(tableRows, tableConfig);
};
