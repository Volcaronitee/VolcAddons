import settings from "../../settings";
import {AQUA, BOLD, DARK_PURPLE, DARK_RED, GRAY, GREEN, MUSIC, RED, WHITE} from "../../utils/constants";
import { data, registerWhen } from "../../utils/variables";

// NO KEY ALERT
registerWhen(register("chat", () => {
    Client.Companion.showTitle(`${BOLD}NO KUUDRA KEY!`, "", 10, 50, 10);
}).setCriteria("WARNING: You do not have a key for this tier in your inventory, you will not be able to claim rewards."),
() => data.world == "kuudra" && settings.kuudraAlerts && settings.keyAlert);

// UNREADY ALERT
registerWhen(register("chat", (player) => {
    const name = player.removeFormatting().toUpperCase();
    MUSIC.play();
    Client.Companion.showTitle(`${DARK_RED}${BOLD}${name} ${WHITE}IS NO LONGER READY!`, "", 10, 50, 10);
}).setCriteria("${player} is no longer ready!"), () => data.world == "kuudra" && settings.kuudraAlerts && settings.unreadyAlert);

// CHOOSE PERK
registerWhen(register("chat", () => {
    MUSIC.play();
    Client.Companion.showTitle(`${AQUA}${BOLD}BUY UPGRADE ROUTE!`, "", 10, 100, 10);
}).setCriteria("[NPC] Elle: Okay adventurers, I will go and fish up Kuudra!"),
() => data.world == "kuudra" && settings.kuudraAlerts && settings.routeAlert);

// SUPPLY ALERT
registerWhen(register("chat", () => {
    MUSIC.play();
    Client.Companion.showTitle(`${AQUA}${BOLD}PICKUP SUPPLY!`, "", 10, 100, 10);
}).setCriteria("[NPC] Elle: Not again!"), () => data.world == "kuudra" && settings.kuudraAlerts && settings.supplyAlert);

// BUILDING ALERT
registerWhen(register("chat", () => {
    MUSIC.play();
    Client.Companion.showTitle(`${AQUA}${BOLD}START BUILDING!`, "", 10, 50, 10);
}).setCriteria("[NPC] Elle: It's time to build the Ballista again! Cover me!"),
() => data.world == "kuudra" && settings.kuudraAlerts && settings.buildingAlert);

// FRESH TOOLS ALERT
registerWhen(register("chat", () => {
    MUSIC.play();
    Client.Companion.showTitle(`${GREEN}${BOLD}EAT FRESH!`, "", 10, 50, 10);
}).setCriteria("Your Fresh Tools Perk bonus doubles your building speed for the next 5 seconds!"),
() => data.world == "kuudra" && settings.kuudraAlerts && settings.freshAlert);

// FUEL ALERTS
registerWhen(register("chat", (player, percentage) => { // Ballista full alert
    MUSIC.play();
    switch (percentage) {
        case "100":
            Client.Companion.showTitle(`${AQUA}${BOLD}100% ${GRAY}[${GREEN}||||${GRAY}]`, "", 10, 100, 10);
            break;
        case "75":
            Client.Companion.showTitle(`${AQUA}${BOLD}75% ${GRAY}[${GREEN}|||${RED}|${GRAY}]`, "", 10, 50, 10);
            break;
        case "50":
            Client.Companion.showTitle(`${AQUA}${BOLD}50% ${GRAY}[${GREEN}||${RED}||${GRAY}]`, "", 10, 50, 10);
            break;
        case "25":
            Client.Companion.showTitle(`${AQUA}${BOLD}25% ${GRAY}[${GREEN}|${RED}|||${GRAY}]`, "", 10, 50, 10);
            break;
    }
}).setCriteria("${player} recovered a Fuel Cell and charged the Ballista! (${percentage}%)"),
() => data.world == "kuudra" && settings.kuudraAlerts && settings.fuelAlert);

registerWhen(register("chat", (player) => { // Stunner eaten alert
    const ign = player.toUpperCase();
    const stunner = settings.kuudraStunner.toUpperCase();

    if (!ign.equals("ELLE") && (stunner.length == 0 || ign.equals(stunner))) {
        MUSIC.play();
        Client.Companion.showTitle(`${GREEN}${BOLD}${ign} WAS EATEN!`, "", 10, 100, 10);
    }
}).setCriteria("${player} has been eaten by Kuudra!"), () => data.world == "kuudra" && settings.kuudraAlerts && settings.fuelAlert);

registerWhen(register("chat", (player) => { // Ballista mounted alert
    const ign = player.toUpperCase();
    const cannonear = settings.kuudraCannonear.toUpperCase();

    if (settings.kuudraCannonear.length == 0 || ign.equals(cannonear)) {
        MUSIC.play();
        Client.Companion.showTitle(`${AQUA}${BOLD}${ign} ASSUMED THE POSITION!`, "", 10, 100, 10);
    }
}).setCriteria("${player} mounted a Cannon!"), () => data.world == "kuudra" && settings.kuudraAlerts && settings.ballistaAlert);

registerWhen(register("chat", (player) => { // Kuudra stunned alert
    MUSIC.play();
    Client.Companion.showTitle(`${GREEN}${BOLD}KUUDRA STUNNED!`, "", 10, 100, 10);
}).setCriteria("{player} destroyed one of Kuudra's pods!"), () => data.world == "kuudra" && settings.kuudraAlerts && settings.stunAlert);

const EntityGhast = Java.type('net.minecraft.entity.monster.EntityGhast');
let alerted = false
registerWhen(register("step", () => {
    // DROPSHIP WARNING
    if (settings.kuudraAlerts && settings.dropshipAlert) {
        let ghasts = World.getAllEntitiesOfType(EntityGhast.class);
        const dropships = ghasts.filter((ghast) => {
            distance = Math.hypot(ghast.getX() + 101, ghast.getZ() + 105);
            return distance < 20 && distance > 10;
        })

        if (dropships.length)
            Client.Companion.showTitle(`${RED}${BOLD}ART IS AN EXPLOSION!`, "", 0, 50, 5);
    }
}).setFps(1), () => data.world == "kuudra" && settings.kuudraAlerts && settings.dropshipAlert);

registerWhen(register("step", () => {
    // TOKEN ALERT
    if (settings.kuudraAlerts && settings.tokenAlert && !alerted) {
        tokens = Scoreboard.getLines().find((line) => line.getName().includes("Tokens"));
        if (tokens) {
            tokens = tokens.getName().removeFormatting().replace(/\D/g,'');
            if (tokens >= Math.round(settings.tokenAlert / 10) * 10) {
                Client.Companion.showTitle(`${BOLD}${tokens} ${DARK_PURPLE}${BOLD}TOKENS GATHERED!`, "", 0, 50, 5);
                alerted = true
            }
        }
    }
}).setFps(5), () => data.world == "kuudra" && settings.kuudraAlerts && settings.tokenAlert);

register("worldLoad", () => {
    alerted = false;
});