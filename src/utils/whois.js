module.exports.rdapLookup = async host => {
    const resp = await fetch(`https://rdap.cloud/api/v1/${host}`);
    const rawData = await resp.json().catch(() => false);
    const data = rawData?.results?.[host];

    // Ensure the data is there
    if (!data || !data.success || !data.data)
        return false;

    // Utils to find the data
    const findEntity = name =>
        data.data?.entities?.find(entity => entity.roles.map(role => role.trim().toLowerCase()).includes(name))
            ?.vcardArray?.[1].find(card => card[0] === 'fn')?.[3];
    const findEvent = name =>
        data.data?.events?.find(event => event.eventAction.trim().toLowerCase() === name)?.eventDate;

    // Find the useful information for us
    const registrar = findEntity('registrar');
    const registrant = findEntity('registrant');
    const registration = findEvent('registration');
    const expiration = findEvent('expiration');

    // If we found nothing, abort
    if (!registrar && !registrant && !registration && !expiration)
        return false;

    // Done
    return {
        registrar,
        registrant,
        registration: registration ? new Date(registration) : undefined,
        expiration: expiration ? new Date(expiration) : undefined,
    };
};

const parseWhois = text => {
    // RegExp parts
    const reLinebreak = '\\r\\n';
    const reWhitespace = `[^\\S${reLinebreak}]`;
    const reKey = '([a-zA-Z\\s]+):';
    const reText = `([^${reLinebreak}]+)`;
    const reLineStart = `^${reWhitespace}*${reKey}`;
    const reLineEnd = `${reWhitespace}+${reText}$`;

    // The RegExps to be used
    const reSingleLine = `${reLineStart}${reLineEnd}`;
    const regExpSingleLineGm = new RegExp(reSingleLine, 'gm');
    const regExpSingleLine = new RegExp(reSingleLine);
    const reSplitLine = `${reLineStart}[${reLinebreak}]+${reLineEnd}`;
    const regExpSplitLineGm = new RegExp(reSplitLine, 'gm');
    const regExpSplitLine = new RegExp(reSplitLine);

    // Find the matches in the string
    const singleLineMatches = text.match(regExpSingleLineGm);
    const splitLineMatches = text.match(regExpSplitLineGm);
    const matches = {};

    // All single line matches are valid
    for (const rawMatch of singleLineMatches) {
        const match = rawMatch.trim().match(regExpSingleLine);
        matches[match[1]] = match[2];
    }

    // Split line matches that don't include a single line match are valid
    for (const rawMatch of splitLineMatches) {
        if (singleLineMatches.map(singleLineMatch => rawMatch.includes(singleLineMatch)).includes(true))
            continue;

        const match = rawMatch.trim().match(regExpSplitLine);
        matches[match[1]] = match[2];
    }

    // Return the final parsed data
    return matches;
}

module.exports.whoisLookup = async host => {
    const resp = await fetch(`https://whoisjs.com/api/v1/${host}`);
    const rawData = await resp.json().catch(() => false);

    // Ensure the data is there
    if (!rawData || !rawData.success || !rawData.raw)
        return false;

    // Parse ourselves
    const data = parseWhois(rawData.raw);
    if (!data)
        return false;

    // Util to find the data
    const findAttribute = name =>
        data.find(attribute => attribute.attribute.trim().toLowerCase() === name)?.value?.trim();

    // Find the useful information for us
    const registrar = findAttribute('registrar');
    const registrant = findAttribute('registrant');
    const registration = findAttribute('creation date') || findAttribute('registered on');
    const expiration = findAttribute('registry expiry date') || findAttribute('expiry date');

    // If we found nothing, abort
    if (!registrar && !registrant && !registration && !expiration)
        return false;

    // Done
    return {
        registrar,
        registrant,
        registration: registration ? new Date(registration) : undefined,
        expiration: expiration ? new Date(expiration) : undefined,
    };
};

module.exports.performLookup = async host => {
    // TODO: Do rdap lookup, fallback to whois
};
