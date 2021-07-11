const test = require('./test');

const redirectTest = (route, result) => async t => {
    // Make the request
    const res = await t.context.mf.dispatchFetch(`http://localhost:8787${route}`);

    // Check it is a redirect
    t.is(res.status, 301);

    // Check the redirect location
    t.is(res.headers.get('Location'), result);
};

test('GET / : returns a redirect to Cloudflare docs',
    redirectTest('/', 'https://developers.cloudflare.com/1.1.1.1/fun-stuff/dns-over-discord'));

test('GET /github : returns a redirect to GitHub repository',
    redirectTest('/github', 'https://github.com/MattIPv4/DNS-over-Discord/'));

test('GET /server : returns a redirect to Discord server',
    redirectTest('/server', 'https://discord.gg/JgxVfGn'));

test('GET /invite : returns a redirect to Discord OAuth2',
    redirectTest('/invite', `https://discord.com/oauth2/authorize?client_id=${process.env.CLIENT_ID}&scope=applications.commands`));
