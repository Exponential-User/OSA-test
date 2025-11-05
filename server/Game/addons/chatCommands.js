const prefix = "$";

/** COMMANDS **/
let commands = [
  {
        command: ["help"],
        description: "Show this help menu.",
        level: 0,
        run: ({ socket, level }) => {
            let useOldMenu = false;
            let lines = [
            "Help menu:",
            ...commands.filter((c) => level >= c.level && !c.hidden).map((c) => {
                    let cmdData = [c.command];
                    let commandText = cmdData.map((e) => e.map((name) => name).join(` or ${prefix} `)).join(" ")
                    let description = c.description ?? false;
                    let text = `- ${prefix} ${commandText}`;
                    if (description) text += ` - ${description}`;
                    return text;
                }),
            ];
            if (useOldMenu) {
                for (let line of lines.reverse()) {
                    socket.talk("m", 15_000, line);
                }
            } else socket.talk("Em", 15_000, JSON.stringify(lines));
        },
    },
    {
        command: ["leaderboard", "b"],
        description: "Select the leaderboard to display.",
        level: 0,
        run: ({ socket, args }) => {
            let sendAvailableLeaderboardMessage = () => {
                let lines = [
                    "Available leaderboards:",
                    ...leaderboards.map(lb => `- ${lb}`)
                ];
                socket.talk("Em", 10_000, JSON.stringify(lines));
            };

            const leaderboards = [
                "default",
                "players",
                "bosses",
                "global",
            ];
            const choice = args[0];

            if (!choice) {
                sendAvailableLeaderboardMessage(socket);
                return;
            }

            if (leaderboards.includes(choice)) {
                socket.status.selectedLeaderboard = choice;
                socket.status.forceNewBroadcast = true;
                socket.talk("m", 4_000, "Leaderboard changed.");
            } else {
                socket.talk("m", 4_000, "Unknown leaderboard.");
            }
        }
    },
    {
        command: ["toggle", "t"],
        description: "Enable or disable chat",
        level: 0,
        run: ({ socket }) => {
            socket.status.disablechat = socket.status.disablechat ?? false;
            socket.talk("m", 3_000, `In-game chat ${socket.status.disablechat ? "enabled" : "disabled"}`);
        }
    },
    {
        command: ["arena"],
        description: "Manage the arena",
        level: 1,
        hidden: true,
        run: ({ socket, args, gameManager }) => {
            let sendAvailableArenaMessage = () => {
                let lines = [
                    "Help menu:",
                    `- ${prefix} arena size dynamic - Make the size of the arena dynamic, depending on the number of players`,
                    `- ${prefix} arena size <width> <height> - Set the size of the arena`,
                    `- ${prefix} arena team <team> - Set the number of teams, from 0 (FFA) to 4 (4TDM)`,
                    `- ${prefix} arena spawnpoint [x] [y] - Set a location where all players spawn on default`,
                    `- ${prefix} arena close - Close the arena`,
                ];
                if (!Config.SANDBOX) lines.splice(1, 1)
                socket.talk("Em", 10_000, JSON.stringify(lines));
            }
            if (!args[0]) sendAvailableArenaMessage(); else {
                switch (args[0]) {
                    case "size":
                        if (args[1] === "dynamic") {
                            if (!Config.SANDBOX) return socket.talk("m", 3_000, "This command is only available on sandbox.");
                            gameManager.room.settings.sandbox.do_not_change_arena_size = false;
                        } else {
                            if (!args[1] || !args[2]) return socket.talk("m", 3_000, "Invalid arguments.");
                            if (args[1] % 2 === 0 && args[2] % 2 === 0) {
                                if (Config.SANDBOX) gameManager.room.settings.sandbox.do_not_change_arena_size = true;
                                gameManager.updateBounds(args[1] * 30, args[2] * 30);
                            } else {
                                socket.talk("m", 3000, "Arena size must be even.");
                            }
                        }
                        break;
                    case "team":
                        if (!args[1]) return socket.talk("m", 3_000, "Invalid argument.");
                        if (args[1] === "0") {
                            Config.MODE = "ffa";
                            Config.TEAMS = null;
                            socket.rememberedTeam = undefined;
                        } else {
                            Config.MODE = "tdm";
                            Config.TEAMS = args[1];
                            socket.rememberedTeam = undefined;
                        }
                        break;
                    case "spawnpoint":
                        if (!args[1] || !args[2]) return socket.talk("m", 3_000, "Invalid arguments.");
                        socket.talk("m", 4_000, "Spawnpoint set.");
                        global.spawnPoint = {
                            x: parseInt(args[1] * 30),
                            y: parseInt(args[2] * 30),
                        };
                        break;
                    case "close":
                        util.warn(`${socket.player.body.name === "" ? `An unnamed player (ip: ${socket.ip})` : socket.player.body.name} has closed the arena.`);
                        gameManager.closeArena();
                        break;
                    default:
                        socket.talk("m", 4_000, "Unknown subcommand.");
                }
            }
        }
    },
    {
        command: ["broadcast"],
        description: "Broadcast a message to all players.",
        level: 3,
        // hidden: true,
        run: ({ args, socket }) => {
            if (!args[0]) {
                socket.talk("m", 5_000, "No message specified.");
            }
            else {
                gameManager.socketManager.broadcast(args.join(" "));
            }
        }
    },
    {
        command: ["admin", "adm"],
        description: "Admin commands, Abusing these without permission will get your role revoked",
        level: 4,
        run: ({ socket, args, gameManager }) => {
            let sendAvailableAdminCommandsMessage = () => {
                let lines = [
                    "Help menu:",
                    "- $ (admin / adm) kick <player name> <reason> - kicks a player from the server.",
                    "- $ (admin / adm) tp <player name> <x> <y> - Teleports a player to a specified position.",
                ];
                socket.talk("Em", 10_000, JSON.stringify(lines));
            }
            if (!args[0]) sendAvailableAdminCommandsMessage();
            else {
                switch (args[0]) {
                    case "kick":
                        if (!args[1]) {
                            socket.talk("m", 5_000, "No player specified.");
                            return;
                        }
                        let playerToKick = Array.from(gameManager.clients).find(s => s.player.body.name.toLowerCase() === args[1].toLowerCase());
                        if (!playerToKick) {
                            socket.talk("m", 5_000, "Player not found.");
                            return;
                        }
                        let reason = (args[2] !== undefined || args[2] !== null || args.length > 3) ? args.slice(2).join(" ") : "No reason specified.";
                        playerToKick.talk("m", 30_000, "You have been kicked from the server by an admin.");
                        playerToKick.kick(args[1] + " was kicked by an admin, With reason: " + reason, reason);
                        socket.talk("m", 10_000, args[1] + " was kicked.");
                        break;
                    case "tp":
                        if ((!args[1] || !args[2] || !args[3])) {
                            socket.talk("m", 5_000, "Invalid arguments.");
                            return;
                        }
                        let x = parseInt(args[2] * 30);
                        let y = parseInt(args[3] * 30);
                        let playerIndex = 0;
                        for (let player of gameManager.clients) {
                            if (player.player.body.name.toLowerCase() === args[1].toLowerCase()) break;
                            playerIndex++;
                        }
                        gameManager.clients[playerIndex].player.body.x = x;
                        gameManager.clients[playerIndex].player.body.y = y;
                        // socket.player.body.refreshBodyAttributes();
                        socket.talk("m", 5_000, `Teleported to (${args[2]}, ${args[3]}).`);
                        break;
                }
            }
        }
    },
    {
        command: ["getObject", "go"],
        description: "Logs an object to the server process. (Used for debugging purposes)",
        level: 5,
        // hidden: true,
        run: ({ gameManager, socket, args }) => {
            let sendAvailablegetEntitiesCommandsMessage = () => {
                let lines = [
                    "Help menu:",
                    "- $ (getObject / go) <object> <path to object/array> - logs the object, array, value, or function to the server process. (useful for debugging)",
                ];
                socket.talk("Em", 10_000, JSON.stringify(lines));
            }

            let path;
            console.log("Getting object path:", args);
            if (!args[0]) sendAvailablegetEntitiesCommandsMessage();
            else {
                switch (args[0]) {
                    case "gameManager":
                        path = getObjectPath(args.slice(1), gameManager);
                        socket.talk("m", 5_000, "gameManager logged to server process.");
                        break;
                    case "socket":
                        path = getObjectPath(args.slice(1), socket);
                        socket.talk("m", 5_000, "Socket logged to server process.");
                        break;
                }
            }
            if (typeof path === "function") {
                socket.talk("m", 5_000, "This path is a function. Check the server console.");
                console.log(path.toString());
                return;
            } else if (path === undefined) {
                socket.talk("m", 5_000, "Invalid path.");
                return;
            }
            console.log(path);
        }
    },
    {
        command: ["developer", "dev"],
        description: "Developer commands, do something with these.",
        level: 5,
        run: ({ socket, args, gameManager }) => {
            let sendAvailableDevCommandsMessage = () => {
                let lines = [
                    "Help menu:",
                    "- $ (developer / dev) reloaddefs - reloads definitions.",
                ];
                socket.talk("Em", 10_000, JSON.stringify(lines));
            }
            let command = args[0];
            if (command === "reloaddefs" || command === "redefs") {
                /* IMPORT FROM (defsReloadCommand.js) */
                if (!global.reloadDefinitionsInfo) {
                    global.reloadDefinitionsInfo = {
                        lastReloadTime: 1,
                    };
                }
                // Rate limiter for anti-lag
                let time = performance.now();
                let sinceLastReload = time - global.reloadDefinitionsInfo.lastReloadTime;
                if (sinceLastReload < 5000) {
                    socket.talk('m', Config.MESSAGE_DISPLAY_TIME, `Wait ${Math.floor((5000 - sinceLastReload) / 100) / 10} seconds and try again.`);
                    return;
                }
                // Set the timeout timer ---
                lastReloadTime = time;

                // Remove function so all for(let x in arr) loops work
                delete Array.prototype.remove;

                // Before we purge the class, we are going to stop the game interval first
                gameManager.gameHandler.stop();

                // Now we can purge Class
                Class = {};

                // Log it.
                util.warn(`[IMPORTANT] Definitions are going to be reloaded on server ${gameManager.gamemode} (${gameManager.webProperties.id})!`);

                // Purge all cache entries of every file in definitions
                for (let file in require.cache) {
                    if (!file.includes('definitions') || file.includes(__filename)) continue;
                    delete require.cache[file];
                }

                // Load all definitions
                gameManager.reloadDefinitions();

                // Put the removal function back
                Array.prototype.remove = function (index) {
                    if (index === this.length - 1) return this.pop();
                    let r = this[index];
                    this[index] = this.pop();
                    return r;
                };

                // Redefine all tanks and bosses
                for (let entity of entities.values()) {
                    // If it's a valid type, and it's not a turret
                    if (!['tank', 'miniboss', 'food'].includes(entity.type)) continue;
                    if (entity.bond) continue;

                    let entityDefs = JSON.parse(JSON.stringify(entity.defs));
                    // Save color to put it back later
                    let entityColor = entity.color.compiled;

                    // Redefine all properties and update values to match
                    entity.upgrades = [];
                    entity.define(entityDefs);
                    for (let instance of entities.values()) {
                        if (
                            instance.settings.clearOnMasterUpgrade &&
                            instance.master.id === entity.id
                        ) {
                            instance.kill();
                        }
                    }
                    entity.skill.update();
                    entity.syncTurrets();
                    entity.refreshBodyAttributes();
                    entity.color.interpret(entityColor);
                }

                // Tell the command sender
                socket.talk('m', Config.MESSAGE_DISPLAY_TIME, "Successfully reloaded all definitions.");


                // Erase mockups so it can rebuild.
                mockupData = [];
                // Load all mockups if enabled in configuration
                if (Config.LOAD_ALL_MOCKUPS) global.loadAllMockups(false);

                setTimeout(() => { // Let it sit for a second.
                    // Erase cached mockups for each connected clients.
                    gameManager.clients.forEach(socket => {
                        socket.status.mockupData = socket.initMockupList();
                        socket.status.selectedLeaderboard2 = socket.status.selectedLeaderboard;
                        socket.status.selectedLeaderboard = "stop";
                        socket.talk("RE"); // Also reset the global.entities in the client so it can refresh.
                        if (Config.LOAD_ALL_MOCKUPS) for (let i = 0; i < mockupData.length; i++) {
                            socket.talk("M", mockupData[i].index, JSON.stringify(mockupData[i]));
                        }
                        socket.status.selectedLeaderboard = socket.status.selectedLeaderboard2;
                        delete socket.status.selectedLeaderboard2;
                        socket.talk("CC"); // Clear cache
                    });
                    // Log it again.
                    util.warn(`[IMPORTANT] Definitions are successfully reloaded on server ${gameManager.gamemode} (${gameManager.webProperties.id})!`);
                    gameManager.gameHandler.run();
                }, 1000)
            } else sendAvailableDevCommandsMessage();
        },
    },
]

/** COMMANDS RUN FUNCTION **/
function runCommand(socket, message, gameManager) {
    if (!message.startsWith(prefix) || !socket?.player?.body) return;

    let args = message.slice(prefix.length).split(" ");
    let commandName = args.shift();
    let command = commands.find((command) => command.command.includes(commandName));
    if (command) {
        let permissionsLevel = socket.permissions?.level ?? 0;
        let level = command.level;

        if (permissionsLevel >= level) {
            try {
                command.run({ socket, message, args, level: permissionsLevel, gameManager: gameManager });
            } catch (e) {
                console.error("Error while running ", commandName);
                console.error(e);
                socket.talk("m", 5_000, "An error occurred while running this command.");
            }
        } else socket.talk("m", 5_000, "You do not have access to this command.");
    } else socket.talk("m", 5_000, "Unknown command.");

    return true;
}
global.addChatCommand = function (command) {
    if (!command.command || !command.run) {
        throw new Error("Invalid command format. A command must have at least a 'command' and a 'run' property.");
    }
    if (!Array.isArray(command.command)) {
        throw new Error("Invalid command format. The 'command' property must be an array of strings.");
    }
    if (commands.find(c => c.command.some(cmd => command.command.includes(cmd)))) {
        throw new Error("A command with this name already exists.");
    }
    commands.push(command);
}

/** HELPER FUNCTIONS **/
function getObjectPath(args, object) {
    if (!args || (Array.isArray(args) && args.length === 0)) {
        return object;
    }

    // Normalize the path into an array of keys (handles arrays & dotted strings)
    const parts = Array.isArray(args)
        ? args.flatMap(seg =>
            Array.isArray(seg)
                ? seg.flatMap(s => (typeof s === 'string' ? s.split('.') : [s]))
                : (typeof seg === 'string' ? seg.split('.') : [seg])
        )
        : (typeof args === 'string' ? args.split('.') : [args]);

    // Further split parts like "clients[0].player" into ["clients", "0", "player"]
    const normalized = parts.flatMap(p =>
        typeof p === 'string' ? p.split(/[\[\].]+/).filter(Boolean) : [p]
    );

    console.log("Normalized parts:", normalized);

    let result = object;

    for (let part of normalized) {
        if (result == null) return undefined;

        // Convert numeric keys to integers when accessing arrays
        if (Array.isArray(result) && /^\d+$/.test(part)) {
            part = parseInt(part, 10);
        }

        result = result[part];
        // console.log("Accessing key:", part, "\nResult:", result); // DEBUG
    }

    return result;
}


/** CHAT MESSAGE EVENT **/
module.exports = ({ Events }) => {
    Events.on("chatMessage", ({ socket, message, preventDefault, gameManager }) => {
        if (message.startsWith(prefix)) {
            preventDefault();
            runCommand(socket, message, gameManager);
        }
    });
}, module.exports.CAC = function (partial, socket) {// Command Auto Complete
    let permissionsLevel = socket.permissions?.level ?? 0;
    let availableCommands = commands.filter(command => permissionsLevel >= command.level);
    let matchingCommands = availableCommands.filter(command =>
        command.command.some(cmd => cmd.startsWith(partial))
    );
    let suggestions = [];
    for (let command of matchingCommands) {
        for (let cmd of command.command) {
            if (cmd.startsWith(partial) && !suggestions.includes(cmd)) {
                suggestions.push(cmd);
            }
        }
    }
    return suggestions;
};
