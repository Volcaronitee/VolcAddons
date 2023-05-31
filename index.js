// Import outer scope variables
import settings from "./settings";
import { data, getWorld, getZone, updateList } from "./utils/variables";
import { AQUA, BOLD, GOLD, GRAY, GREEN, ITALIC, RED, RESET, UNDERLINE, WHITE } from "./utils/constants";
data.autosave();

// General
import "./features/PartyCommands";
import "./features/RemoveSelfie";
import "./features/JoinWhitelist";
import "./features/DrawWaypoint";
import "./features/GyroTimer";
import "./features/ReminderTimer";
import { createWaypoint, enigmaEdit } from "./features/DrawWaypoint";
import "./features/JoinReparty";
import "./features/HealthAlert";

// Hub
import "./features/DianaWaypoint";
import { setWarps } from "./features/DianaWaypoint";
import "./features/AnnouceMob";

// Private Island
import "./features/BazaarCalculator";
import { calculate, setApex } from "./features/BazaarCalculator";

// Crimson Isles
import "./features/BrokenHyp";
import "./features/GoldenFishAlert";
import "./features/VanqWarp";
import "./features/VanqCounter";
import "./features/AbiphoneBlocker";

// Kuudra
import "./features/KuudraAlerts";
import "./features/KuudraReparty";
import "./features/KuudraCrates";
import "./features/KuudraHP";
import "./features/KuudraSplits";
import { getSplits } from "./features/KuudraSplits";
import "./features/RagDetect";

// Garden
import "./features/GardenTab";
import { executeCommand } from "./features/PartyCommands";

// FIRST RUN
if (data.newUser) {
    ChatLib.chat(`\n${GOLD}${BOLD}${UNDERLINE}VolcAddons v${JSON.parse(FileLib.read("VolcAddons", "metadata.json")).version}${RESET}`);
    ChatLib.chat("Ya got any grapes? (P.S. do /volcaddons, /volc, /va, /itee)");
    ChatLib.chat("Instruction manual (i think) => /va help\n");

    data.newUser = false;
}

// NEW UPDATE
register("chat", () => {
    setTimeout(() => {
        if (JSON.parse(FileLib.read("VolcAddons", "metadata.json")).version != data.version) {
            data.version = JSON.parse(FileLib.read("VolcAddons", "metadata.json")).version;
            ChatLib.chat(`${GOLD}VolcAddons ${GRAY}> ${WHITE}${BOLD}LATEST UPDATE ${GRAY}[v${JSON.parse(FileLib.read("VolcAddons", "metadata.json")).version}]!`);
            ChatLib.chat("-Fixed /va splits mm/dd/yyyy not working");
            ChatLib.chat("-Fixed build waypoints still showing after run");
            ChatLib.chat("-Improved command descriptions and generalized them in /va help");
            ChatLib.chat("-Added /va splits worst/today");
            ChatLib.chat("-Added Vanquisher sound to coord detection too");
            ChatLib.chat("-Added non tested Enigma souls");
            data.splits.worst = [0, 0, 0, 0 ,0];
        }
    }, 1000);
}).setCriteria("Welcome to Hypixel SkyBlock!");

// HELP
function getHelp() {
    ChatLib.chat(`\n${GOLD}${BOLD}${UNDERLINE}VolcAddons v${JSON.parse(FileLib.read("VolcAddons", "metadata.json")).version}${RESET}\n`);
    
    // General Commands
    ChatLib.chat(`${AQUA}${BOLD}GENERAL COMMANDS:${RESET}`);
    ChatLib.chat(`${GRAY}${BOLD}Settings: ${RESET}/va <help, settings, clear ${ITALIC}(resets text settings)${RESET}>`);
    ChatLib.chat(`${GRAY}${BOLD}General: ${RESET}/va <waypoint, whitelist, blacklist, warplist>`);
    ChatLib.chat(`${GRAY}${BOLD}Kuudra: ${RESET}/va splits`);
    ChatLib.chat(`${RED}${BOLD}Inferno Minions:${RESET}/va <calc, apex>\n`);

    // General Features
    ChatLib.chat(`${AQUA}${BOLD}GENERAL FEATURES:${RESET}`);
    ChatLib.chat(`${GRAY}${BOLD}Party Commands: ${RESET}?<warp, transfer, promote, demote, allinv>`);
    ChatLib.chat(`${GRAY}${BOLD}Other Commands: ${RESET}?<cringe, gay, racist, dice, flip, 8ball, rps, w>\n`);
    
    // Crimson Isle Features
    ChatLib.chat(`${AQUA}${BOLD}OTHER FEATURES:${RESET}`);
    ChatLib.chat(`Should be self explanatory, DM Volcaronitee#0233 on discord if any questions...`);
    ChatLib.chat(`That one is termed for the moment, please contact #0051 instead :skull:`);
}

// GENERAL FUNCTION COMMANDS
const PARTY_COMMANDS = ["cringe", "gay", "racist", "dice", "roll", "coin", "flip", "coinflip", "cf", "8ball", "rps", "waifu", "w"];

register ("command", (...args) => {
    const command = args[0] == undefined ? undefined : args[0].toLowerCase();
    switch (command) {
        case undefined: // HELP
            settings.openGUI();
            break;
        case "help": // HELP
            getHelp();
            break;
        case "settings": // SETTINGS
            settings.openGUI();
            break;
        case "clear": // CLEAR ALL TEXT PROPERTIES IN SETTINGS
            settings.vanqParty = "";
            settings.kuudraRP = "";
            settings.kuudraCannonear = "";
            settings.kuudraStunner = "";
            ChatLib.chat(`${GREEN}Successfully cleared all text property settings!`);
            break;
        case "coords": // sendcoords
        case "sendcoords":
        case "xyz":
            const id = (Math.random() + 1).toString(36).substring(7);
            ChatLib.say(`x: ${Math.round(Player.getX())}, y: ${Math.round(Player.getY())}, z: ${Math.round(Player.getZ())} @${id}`);
            break;
        case "whitelist": // ADD / REMOVE USER FROM WHITELIST
        case "white":
        case "wl":
            updateList(args, data.whitelist, "white-list");
            break;
        case "blocklist":
        case "block":
        case "bl":
            updateList(args, data.blocklist, "block-list");
            break;
        case "warplist":
        case "warp":
            updateList(args, data.warplist, "warp-list");
            setWarps();
            break;
        case "splits": // KUUDRA SPLITS
        case "split":
            getSplits(args);
            break;
        case "waypoints": // WAYPOINT MAKER
        case "waypoint":
            createWaypoint(args);
            break;
        case "calculate": // BAZAAR CALCULATOR
        case "calc":
            calculate(args);
            break;
        case "apex":
            setApex(args);
            break;
        case "world":
            ChatLib.chat(getWorld());
            break;
        case "zone":
            ChatLib.chat(getZone());
            break;
        case "moblist":
        case "mob":
        case "ml":
            updateList(args, data.moblist, "mob-list");
            break;
        case "enigma":
            enigmaEdit(args);
            break;
        default: // ELSE CASE -> SETTINGS
            if (PARTY_COMMANDS.includes(command))
                executeCommand(Player.getName(), args, false);
            else
                settings.openGUI();
            break;
    }
}).setName("volcaddons").setAliases("volc", "va", "itee")