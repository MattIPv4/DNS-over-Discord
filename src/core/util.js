/**
 * @typedef {Object} Command
 * @property {string} name
 * @property {string} description
 * @property {function} execute TODO: type
 */

/**
 * @typedef {Object} Component
 * @property {string} name
 * @property {function} execute TODO: type
 */

/**
 * Validate that a given value is a {@link Command} object
 *
 * @param {any} cmd
 * @returns {Command}
 */
const validateCommand = cmd => {
    if (typeof cmd !== 'object' || cmd === null)
        throw new Error('Command must be an object');
    if (typeof cmd.name !== 'string' || !cmd.name.length)
        throw new Error('Command must have a name');
    if (typeof cmd.description !== 'string' || !cmd.description.length)
        throw new Error('Command must have a description');
    if (typeof cmd.execute !== 'function')
        throw new Error('Command must have an execute function');
    return cmd;
};

/**
 * Validate that a set of values are {@link Command} objects
 *
 * @param {any[]} cmds
 * @returns {Record<string, Command>}
 */
export const validateCommands = cmds => cmds.reduce((acc, cmd) => {
    // Validate the command
    cmd = validateCommand(cmd);

    // Check the command doesn't already exist
    if (acc[cmd.name])
        throw new Error(`Command ${cmd.name} already exists`);

    // Add the command
    return {
        ...acc,
        [cmd.name]: cmd,
    };
}, {});

/**
 * Validate that a given value is a {@link Component} object
 *
 * @param {any} cmp
 * @returns {Component}
 */
const validateComponent = cmp => {
    if (typeof cmp !== 'object' || cmp === null)
        throw new Error('Component must be an object');
    if (typeof cmp.name !== 'string' || !cmp.name.length)
        throw new Error('Component must have a name');
    if (typeof cmp.execute !== 'function')
        throw new Error('Component must have an execute function');
    return cmp;
};

/**
 * Validate that a set of values are {@link Component} objects
 *
 * @param {any[]} cmps
 * @returns {Record<string, Component>}
 */
export const validateComponents = cmps => cmps.reduce((acc, cmp) => {
    // Validate the component
    cmp = validateComponent(cmp);

    // Check the component doesn't already exist
    if (acc[cmp.name])
        throw new Error(`Component ${cmp.name} already exists`);

    // Add the component
    return {
        ...acc,
        [cmp.name]: cmp,
    };
}, {});
