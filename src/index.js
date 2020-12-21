const { registerCommands } = require('./commands');
const { runServer } = require('./webserver');

const main = async () => {
    const commands = await registerCommands();

    runServer(commands);
};

main().then(() => {});
