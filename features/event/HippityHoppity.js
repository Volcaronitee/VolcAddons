import location from "../../utils/Location";
import settings from "../../utils/Settings";
import { BOLD, GOLD, GRAY, GREEN, LIGHT_PURPLE, RED, STAND_CLASS, WHITE, YELLOW } from "../../utils/Constants";
import { getSlotCoords } from "../../utils/functions/find";
import { convertToTitleCase, formatNumber, formatTime, romanToNum, unformatNumber, unformatTime } from "../../utils/functions/format";
import { registerWhen } from "../../utils/RegisterTils";
import { Overlay } from "../../utils/Overlay";
import { data } from "../../utils/Data";
import { announceMob } from "../../utils/functions/misc";
import Waypoint from "../../utils/Waypoint";


/**
 * Choco latte
 */
const updateChocolate = register("tick", () => {
    if (Player?.getContainer()?.getName() !== "Chocolate Factory") return;
    const items = Player.getContainer().getItems();

    // Fetch the meaning of life
    const chocoData = items[13];
    if (chocoData) {
        data.chocolate = parseInt(chocoData.getName().removeFormatting().replace(/\D/g, ""));
        data.chocoProduction = parseFloat(chocoData.getLore().find(line => line.endsWith("§8per second"))?.removeFormatting()?.replace(/,/g, "") ?? 0);
        data.chocoLast = Math.floor(Date.now() / 1000);
        
        const allTime = chocoData.getLore().find(line => line.startsWith("§5§o§7All-time"))?.removeFormatting()?.split(' ');
        data.chocoAll = parseFloat(allTime?.[2]?.removeFormatting()?.replace(/,/g, "") ?? 0);
    }

    // Fetch data related to prestiging
    const prestigeData = items[27]?.getUnlocalizedName() === "tile.thinStainedGlass" ? items[28]?.getLore() : items[27]?.getLore();
    if (prestigeData !== undefined) {
        const prestigeTotal = prestigeData.find(line => line.startsWith("§5§o§7Chocolate this Prestige"))?.removeFormatting()?.split(' ');
        data.chocoTotal = parseFloat(prestigeTotal?.[prestigeTotal?.length - 1]?.replace(/,/g, "") ?? 0);

        const pestige = prestigeData.find(line => line.startsWith("§5§o§7§cRequires"))?.removeFormatting()?.split(' ');
        data.chocoPrestige = unformatNumber(pestige?.[1] ?? 0);
    }

    // Fetch eggs
    const eggData = items[35]?.getUnlocalizedName() === "tile.thinStainedGlass" ? items[34]?.getLore() : items[35]?.getLore();
    if (eggData !== undefined) {
        const barnLine = eggData.find(line => line.startsWith("§5§o§7Your Barn:"))?.split(' ')?.[2]?.removeFormatting()?.split('/');
        data.totalEggs = parseInt(barnLine?.[0] ?? 0);
        data.maxEggs = parseInt(barnLine?.[1] ?? 20);
    }
    
    // Multiplier
    const productionData = items[45]?.getLore();
    if (productionData !== undefined) {
        const multiplier = productionData.find(line => line.startsWith("§5§o§7Total Multiplier:"))?.split(' ')?.[2]?.removeFormatting();
        data.chocoMultiplier = parseFloat(multiplier ?? 1);
    }

    // Time tower
    const towerData = items[39]?.getLore();
    if (towerData !== undefined) {
        const timeTower = data.timeTower;
        timeTower.bonus = romanToNum(items[39]?.getName()?.removeFormatting()?.split(' ')?.[2]) / 10;

        const charges = towerData.find(line => line.startsWith("§5§o§7Charges:"));
        timeTower.charges = parseInt(charges?.split(' ')?.[1]?.removeFormatting()?.split('/')?.[0] ?? 0);
        
        const chargeTime = towerData.find(line => line.startsWith("§5§o§7Next Charge:"));
        timeTower.chargeTime = unformatTime(chargeTime?.split(' ')?.[2]?.removeFormatting() ?? 28_800);

        const status = towerData.find(line => line.startsWith("§5§o§7Status: §a§lACTIVE"))?.split(' ')?.[2]?.removeFormatting();
        timeTower.activeTime = status === undefined ? 0 : unformatTime(status);
    }
}).unregister();

/**
 * Chocolate overlay.
 */
const chocoExample =
`§6§lChocolate:
 §eCurrent: §f12.72m
 §eProduction: §73.59k
 §eTotal: §f901.78m
 §eAll-time: §71.11b
 §ePrestige: §f1.00b

§6§lTime:
 §ePrestige: §77hr36m10s
 §eLast Open: §f2m27s

§6§lRabbits:
 §eTotal: §7101
 §eDupes: §f0`;
const chocoOverlay = new Overlay("chocoDisplay", data.CFL, "moveChoco", chocoExample);

registerWhen(register("step", () => {
    const now = Math.floor(Date.now() / 1000);
    const lastOpen = now - data.chocoLast;

    // Time tower calc
    const towerData = data.timeTower;
    const timeLeft = towerData.activeTime - lastOpen;
    const noTower = data.chocoProduction * (data.chocoMultiplier - (towerData.activeTime > 0 ? towerData.bonus : 0)) / data.chocoMultiplier;
    const production = timeLeft > 0 || towerData.activeTime <= 0 ? data.chocoProduction : noTower;

    const charges = parseInt(towerData.charges) + Math.max(0, Math.ceil((lastOpen - towerData.chargeTime) / 28_800));
    const towerStr = timeLeft > 0 ? formatTime(timeLeft) + GREEN + " ✔" :
        charges > 0 ? `${Math.min(3, charges)}/3` : formatTime(Math.abs(lastOpen - towerData.chargeTime)) + RED + " ✘";

    // Chocolate calc
    const boostedCalc = timeLeft > 0 ? (data.chocoProduction - noTower) * timeLeft : 0;
    const chocoCalc = production * lastOpen + boostedCalc;
    const chocoTotal = chocoCalc + data.chocoTotal;
    const chocoAll = chocoCalc + data.chocoAll;
    const prestigeTime = (data.chocoPrestige - chocoTotal) / noTower;

    chocoOverlay.setMessage(
`${GOLD + BOLD}Chocolate:
 ${YELLOW}Current: ${WHITE + formatNumber(chocoCalc + data.chocolate)}
 ${YELLOW}Production: ${GRAY + formatNumber(production)}
 ${YELLOW}Total: ${WHITE + formatNumber(chocoTotal)}
 ${YELLOW}All-time: ${GRAY + formatNumber(chocoAll)}
 ${YELLOW}Prestige: ${data.chocoPrestige > 0 ? WHITE + formatNumber(data.chocoPrestige) : GREEN + "✔"}

${GOLD + BOLD}Time:
 ${YELLOW}Prestige: ${GRAY + (prestigeTime > 0 ? formatTime(prestigeTime, 0, 3) : GREEN + "✔")}
 ${YELLOW}Tower: ${WHITE + towerStr}
 ${YELLOW}Last Open: ${GRAY + formatTime(lastOpen)}

${GOLD + BOLD}Rabbits:
 ${YELLOW}Total: ${WHITE + data.totalEggs}/${data.maxEggs}
 ${YELLOW}Dupes: ${GRAY + data.dupeEggs}
 ${YELLOW}Completion: ${WHITE + (data.totalEggs / 4.57).toFixed(2)}%`);
}).setFps(1), () => settings.chocoDisplay);

/**
 * Rabbit chat detection.
 */
register("chat", (x) => {
    data.chocolate += parseInt(x.replace(/,/g, ''));
    data.dupeEggs++;
}).setCriteria("DUPLICATE RABBIT! +${x} Chocolate");

registerWhen(register("chat", (choco, mult) => {
    data.chocoMultiplier += parseFloat(mult);
    data.chocoProduction += parseInt(choco) * data.chocoMultiplier;
    data.totalEggs++;
}).setCriteria("NEW RABBIT! +${choco} Chocolate and +${mult}x Chocolate per second!"), () => settings.chocoDisplay);

registerWhen(register("chat", (mult) => {
    if (isNaN(mult)) return;
    data.chocoMultiplier += parseFloat(mult);
    data.totalEggs++;
}).setCriteria("NEW RABBIT! +${mult}x Chocolate per second!"), () => settings.chocoDisplay);


/**
 * Highlight best worker.
 */
let bestWorker = 0;
let bestCost = 0;

function findWorker() {
    bestWorker = 0;
    const items = Player.getContainer().getItems();
    const baseMultiplier = data.chocoMultiplier - data.timeTower.bonus;

    // Worker calc
    let maxValue = 0;
    const diff = items[27].getUnlocalizedName() === "tile.thinStainedGlass" ? 0 : 1;
    for (let i = 29 - diff; i < 34 + diff; i++) {
        let worker = items[i].getLore();
        let index = worker.findIndex(line => line === "§5§o§7Cost");
        if (index === -1) continue;
        let cost = parseInt(worker[index + 1].removeFormatting().replace(/\D/g, ""));
        let value = (i - 28 + diff) * baseMultiplier / cost;

        if (value > maxValue) {
            bestWorker = i;
            maxValue = value;
            bestCost = cost;
        }
    }

    // Tower calc
    const tower = items[39].getLore();
    const towerI = tower.findIndex(line => line === "§5§o§7Cost");
    if (settings.rabbitHighlight === 1 && towerI !== 1) {
        const towerCost = parseInt(tower[towerI + 1].removeFormatting().replace(/\D/g, ""));
        const towerValue = data.chocoProduction / baseMultiplier * 0.0125 / towerCost;

        if (towerValue > maxValue) {
            bestWorker = 39;
            maxValue = towerValue;
            bestCost = towerCost;
        }
    }

    // Jackrabbit calc
    const jackrabbit = items[42].getLore();
    const jackI = jackrabbit.findIndex(line => line === "§5§o§7Cost");
    if (settings.rabbitHighlight !== 3 && jackI !== -1) {
        const jackCost = parseInt(jackrabbit[jackI + 1].removeFormatting().replace(/\D/g, ""));
        const jackValue = data.chocoProduction / baseMultiplier * 0.01 / jackCost;

        if (jackValue > maxValue) {
            bestWorker = 42;
            bestCost = jackCost;
        }
    }
}

const workerFind = register("chat", () => {
    Client.scheduleTask(1, () => {
        findWorker();
    });
}).setCriteria("Rabbit ${rabbit} has been promoted to ${rank}!").unregister();

const coachFind = register("chat", () => {
    Client.scheduleTask(1, () => {
        findWorker();
    });
}).setCriteria("You upgraded to Coach Jackrabbit ${rank}!").unregister();

const towerFind = register("chat", () => {
    Client.scheduleTask(1, () => {
        findWorker();
    });
}).setCriteria("You upgraded to Time Tower ${rank}!").unregister();

const workerHighlight = register("guiRender", () => {
    if (bestWorker === 0) return;
    const [x, y] = getSlotCoords(bestWorker);

    Renderer.translate(0, 0, 100);
    Renderer.drawRect(data.chocolate > bestCost ? Renderer.GREEN : Renderer.RED, x, y, 16, 16);
}).unregister();

/**
 * /cf controls.
 */
const chocomatte = register("guiClosed", () => {
    chocomatte.unregister();
    updateChocolate.unregister();
    coachFind.unregister();
    towerFind.unregister();
    workerFind.unregister();
    workerHighlight.unregister();
}).unregister();

registerWhen(register("guiOpened", () => {
    Client.scheduleTask(2, () => {
        if (Player.getContainer().getName() !== "Chocolate Factory") return;

        updateChocolate.register();
        if (settings.rabbitHighlight) {
            findWorker();
            coachFind.register();
            towerFind.register();
            workerFind.register();
            workerHighlight.register();
            chocomatte.register();
        }
    });
}), () => settings.rabbitHighlight !== 0 || settings.chocoDisplay);


/**
 * Egglocator
 */
const eggWaypoints = new Waypoint([0.25, 0.1, 0]);  // Brown Eggs

const EGGS = {
    "015adc61-0aba-3d4d-b3d1-ca47a68a154b": "Breakfast",
    "55ae5624-c86b-359f-be54-e0ec7c175403": "Lunch",
    "e67f7c89-3a19-3f30-ada2-43a3856e5028": "Dinner"
};
let looted = {
    "Breakfast": false,
    "Lunch": false,
    "Dinner": false
};

// Track if egg was looted.
registerWhen(register("chat", (type) => {
    looted[type] = true;
}).setCriteria("You have already collected this Chocolate ${type} Egg! Try again when it respawns!"),
() => (settings.chocoWaypoints || settings.eggTimers) && location.getSeason() === "Spring");

registerWhen(register("chat", (type) => {
    looted[type] = true;
}).setCriteria("HOPPITY'S HUNT You found a Chocolate ${type} Egg ${loc}!"),
() => (settings.chocoWaypoints || settings.eggTimers) && location.getSeason() === "Spring");

registerWhen(register("chat", (type) => {
    looted[type] = false;
}).setCriteria("HOPPITY'S HUNT A Chocolate ${type} Egg has appeared!"),
() => (settings.chocoWaypoints || settings.eggTimers) && location.getSeason() === "Spring");

registerWhen(register("tick", () => {
    const time = World.getTime() % 24_000;
    if (Math.abs(time - 1_000) < 4) looted.Breakfast = false;
    else if (Math.abs(time - 8_000) < 4) looted.Lunch = false;
    else if (Math.abs(time - 15_000) < 4) looted.Dinner = false;
}), () => (settings.chocoWaypoints || settings.eggTimers) && location.getSeason() === "Spring");

register("worldUnload", () => {
    looted = {
        "Breakfast": false,
        "Lunch": false,
        "Dinner": false
    };
});

// ArmorStand ESP susge, UAYOR
registerWhen(register("step", () => {
    const stands = World.getAllEntitiesOfType(STAND_CLASS);
    eggWaypoints.clear();

    stands.forEach(stand => {
        const helmet = stand.getEntity()?.func_71124_b(4);  // getEquipmentInSlot(0: Tool in Hand; 1-4: Armor)
        if (helmet !== null) {
            const id = helmet.func_77978_p()?.func_74775_l("SkullOwner")?.func_74779_i("Id");  // getNBT() +> getNBTTagCompound() => getString()
            if (id in EGGS && !looted[EGGS[id]]) eggWaypoints.push([EGGS[id], stand.getX(), stand.getY() + 1, stand.getZ()]);
        }
    });
}).setFps(1), () => settings.chocoWaypoints);


/**
 * Announce egg location on roulette completion.
 */
let chocoType = "";
let chocoLoc = "";

const announceOnClose = register("guiClosed", () => {
    Client.scheduleTask(5, () => announceMob(settings.chocoAlert, chocoType, Player.getX(), Player.getY(), Player.getZ(), chocoLoc));
    announceOnClose.unregister();
}).unregister();

registerWhen(register("chat", (type, loc) => {
    chocoType = type + " Egg";
    chocoLoc = convertToTitleCase(loc);
    announceOnClose.register();
}).setCriteria("HOPPITY'S HUNT You found a Chocolate ${type} Egg ${loc}!"), () => settings.chocoAlert !== 0);


/**
 * Egg timer overlay.
 * 
 * 18k = midnight
 * Breakfast- 7:00 am = 1_000
 * Lunch- 2:00 pm = 8_000
 * Dinner- 9:00 pm = 15_000
 */
const eggExample = 
`${GOLD + BOLD}Egg Timers:
 ${YELLOW}Breakfast: ${WHITE}bling
 ${YELLOW}Lunch: ${WHITE}bang
 ${YELLOW}Dinner: ${WHITE}bang`;
const eggOverlay = new Overlay("eggTimers", data.CGL, "moveEgg", eggExample);

registerWhen(register("step", () => {
    const time = World.getTime() % 24_000;
    const breakfastTime = time > 1_000 ? 25_000 - time : 1_000 - time;
    const lunchTime = time > 8_000 ? 32_000 - time : 8_000 - time;
    const dinnerTime = time > 15_000 ? 39_000 - time : 15_000 - time;
    eggOverlay.setMessage(
`${GOLD + BOLD}Egg Timers:
 ${YELLOW}Breakfast: ${WHITE + formatTime(breakfastTime / 20)} ${looted.Breakfast ? GREEN + "✔" : RED + "✘"}
 ${YELLOW}Lunch: ${WHITE + formatTime(lunchTime / 20)} ${looted.Lunch ? GREEN + "✔" : RED + "✘"}
 ${YELLOW}Dinner: ${WHITE + formatTime(dinnerTime / 20)} ${looted.Dinner ? GREEN + "✔" : RED + "✘"}`);
}).setFps(1), () => settings.eggTimers && location.getSeason() === "Spring");

registerWhen(register("chat", (type) => {
    Client.showTitle(`${LIGHT_PURPLE + BOLD}EGG SPAWNED!`, `${GOLD}A ${type} Egg ${GOLD}has spawned.`, 10, 50, 10);
}).setCriteria("&r&d&lHOPPITY'S HUNT &r&dA &r${type} Egg &r&dhas appeared!&r"), () => settings.eggTimers && location.getSeason() === "Spring");
