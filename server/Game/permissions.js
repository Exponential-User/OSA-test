// OPERATOR LEVELS
/*
{
    level: 1 // All basic stuff
    level: 2 // All advanced stuff
    level: 3 // beta tester stuff
    level: 4 // Admin stuff
    level: 5 // Developer stuff
} 
*/

module.exports = [
    {
        key: process.env.SHINY,
        discordID: "0",
        nameColor: "#ffffff",
        class: "shinyMenu",
        level: 2,
        name: "unnamed#0000",
        note: "note here",
        roles: ["Shiny"]
    },
    {
        key: process.env.YOUTUBER,
        discordID: "0",
        nameColor: "#ffffff",
        class: "youtuber",
        level: 2,
        name: "unnamed#0000",
        note: "note here",
        roles: ["shiny", "youtuber"]
    },
    {
        key: process.env.BETA_TESTER,
        discordID: "0",
        nameColor: "#c9ffbe",
        class: "shinyMenu", // "betaTester" TODO: CREATE BETA TESTER
        level: 3,
        name: "unnamed#0000",
        note: "note here",
        roles: ["shiny", "betaTester"]
    },
    {
        key: process.env.ADMIN,
        discordID: "0",
        nameColor: "#00bab7",
        class: "shinyMenu", // "admin" TODO: CREATE ADMIN
        administrator: true,
        level: 4,
        name: "unnamed#0000",
        note: "note here",
        roles: ["shiny", "betaTester", "admin"]
    },
    {
        key: process.env.DEVELOPER,
        discordID: "0",
        nameColor: "#cb0000",
        class: "developer",
        administrator: true,
        level: 5,
        name: "unnamed#0000",
        note: "note here",
        roles: ["shiny", "youtuber", "betaTester", "developer"]
    },
]
