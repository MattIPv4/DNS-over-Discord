const path = require('path');
const fs = require('fs');
const snowflakey = require('snowflakey');

const randInt = max => Math.floor(Math.random() * max);

const randomSnowflakes = () => new snowflakey.Worker({
    epoch: 1420070400000,
    workerId: randInt(32),
    processId: randInt(32),
    workerBits: 5,
    processBits: 5,
    incrementBits: 12,
});

const discardSnowflakes = snowflake => Array(randInt(100)).fill(null).forEach(() => snowflake.generate());

// Export method for generating fake commands from Discord
module.exports.testCommands = async commands => {
    // Random:tm: snowflake generation for testing
    const snowflake = randomSnowflakes();
    discardSnowflakes(snowflake);

    // Store modified commands
    const discordCommands = [];

    // Modify the source command data
    for (const command of commands) {
        // Random delay before processing each command
        await new Promise(resolve => setTimeout(resolve, randInt(1000)));

        // Create a shallow copy
        const cmdData = { ...command };

        // Generate a command ID to use
        const cmdId = snowflake.generate();
        discardSnowflakes(snowflake);

        // Modify command options if present
        if ('options' in cmdData) {
            cmdData.options = cmdData.options.map(option => {
                // Create a shallow copy
                const optionData = { ...option };

                // Drop the custom help property we have
                if ('help' in optionData) Reflect.deleteProperty(optionData, 'help');

                // Drop required property if falsey
                if ('required' in optionData && !optionData.required) Reflect.deleteProperty(optionData, 'required');

                return optionData;
            });
        }

        // Return the updated command with the new and modified data
        discordCommands.push({
            ...cmdData,
            id: cmdId,
            version: cmdId,
            application_id: process.env.CLIENT_ID,
            default_permission: true,
            type: 1,
        });
    }

    return discordCommands;
};

// If run directly, generate test environment
if (require.main === module) {
    // Random:tm: snowflake generation for testing
    const snowflake = randomSnowflakes();
    discardSnowflakes(snowflake);

    // Generate an application ID to use
    const appId = snowflake.generate();

    // Output test env
    fs.writeFileSync(path.join(__dirname, '..', '..', 'test.env'),
        `CLIENT_ID=${appId}\nCLIENT_SECRET=\nCLIENT_PUBLIC_KEY=`);
}
