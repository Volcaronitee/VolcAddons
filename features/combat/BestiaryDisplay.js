import settings from "../../utils/Settings";
import { formatTime, romanToNum, unformatNumber } from "../../utils/functions/format";
import { registerWhen } from "../../utils/RegisterTils";
import { Overlay } from "../../utils/Overlay";
import { data } from "../../utils/Data";
import { BOLD, GOLD, GRAY, GREEN, LOGO, WHITE, YELLOW } from "../../utils/Constants";
import { Json } from "../../utils/Json";


/**
 * Parse bestiary level inventory
 * [ [levels], [completed] ]
 */
const bestiaryData = [[], []];

/**
 * Trigger to record and track bestiary menu levels.
 */
const setLevels = register("guiRender", () => {
    const container = Player.getContainer();

    if (bestiaryData[0].length === 0) {
        rows: for (let i = 1; i < 5; i++) {
            for (let j = 1; j < 8; j++) {
                let index = i*9 + j;
                let item = container.getStackInSlot(index);
                if (item === null || item.getRegistryName() === "minecraft:stained_glass_pane") break rows;
                
                let lore = item.getLore();
                let completed = lore[lore.length - 4] === "§5§o§7Overall Progress: §b100% §7(§c§lMAX!§7)";
                bestiaryData[1].push(completed);
                bestiaryData[0].push(completed ? 1 : romanToNum(item.getName().split(' ').pop()));
            }
        }
    }

    bestiaryData[0].forEach((level, i) => {
        let index = 2*parseInt(i/7) + 10 + i;
        let item = container.getStackInSlot(index);
        item.setStackSize(isNaN(level) ? 0 : level);
    })
}).unregister();

/**
 * Trigger to highlight uncompleted bestiary milestones in red.
 */
const setHighlight = register('guiRender', () => {
    bestiaryData[1].forEach((complete, i) => {
        // Credit to https://www.chattriggers.com/modules/v/ExperimentationTable
        if (complete) return;
        let index = 2*parseInt(i/7) + 10 + i
        const x = index % 9;
        const y = Math.floor(index / 9);
        const renderX = Renderer.screen.getWidth() / 2 + ((x - 4) * 18);
        const renderY = (Renderer.screen.getHeight() + 10) / 2 + ((y - Player.getContainer().getSize() / 18) * 18);
    
        Renderer.translate(0, 0, 100);
        Renderer.drawRect(Renderer.color(255, 87, 51, 128), renderX - 9, renderY - 9, 17, 17);
    })
}).unregister();

/**
 * Register/unregister bestiary stack size
 */
registerWhen(register("guiOpened", () => {
    Client.scheduleTask(1, () => {
        const containerName = Player.getContainer().getName();
        if ((!containerName.includes("Bestiary ➜") && !containerName.startsWith("Fishing ➜"))) return;
        setLevels.register();
        setHighlight.register();
    });
}), () => settings.bestiaryGUI);
registerWhen(register("guiClosed", () => {
    setLevels.unregister();
    setHighlight.unregister();
    bestiaryData[0] = [];
    bestiaryData[1] = [];
}), () => settings.bestiaryGUI);


/**
 * Bestiary widget tracker.
 */
const maxBestiary = new Json("bestiary.json", false).getData();
register("guiOpened", () => {
    Client.scheduleTask(1, () => {
        const containerName = Player.getContainer().getName();
        if ((!containerName.includes("Bestiary ➜") && !containerName.startsWith("Fishing ➜"))) return;
        
        const items = Player.getContainer().getItems();
        for (let i = 1; i < 5; i++) {
            for (let j = 1; j < 8; j++) {
                let index = i * 9 + j;
                let item = items[index];
                if (item === null || item.getRegistryName() === "minecraft:stained_glass_pane") break;
                
                let name = item.getName().removeFormatting().split(' ').slice(0, -1).join(' ');
                let lore = item.getLore();
                let ind = lore.findIndex(line => line.startsWith("§5§o§7Overall Progress: §b"));
                let max = unformatNumber(lore[ind + 1].removeFormatting().split('/')[1]);
                if (max !== 0 && name !== '') maxBestiary[name] = max;
            }
        }
    });
});

const bestiaryExample = 
`§6§lWolf: §f3 (10800.00/hr)
 §eNext: §715m39s
 §eMax: §73h24m32s`;
const bestiaryOverlay = new Overlay("bestiaryCounter", data.BEL, "moveBe", bestiaryExample);

// Dict of [start, now, next]
let beCounter = {};
let beTime = 0;

register("command", () => {
    beCounter = {};
    bestiaryOverlay.setMessage("");
    ChatLib.chat(`${LOGO + GREEN}Successfully reset bestiary counter.`);
}).setName("resetBe");

registerWhen(register("step", () => {
    if (!World.isLoaded()) return;
    const tablist = TabList.getNames();
    let index = tablist.findIndex(name => name.startsWith("§r§6§lBestiary:§r")) + 1;
    if (index === 0) return;

    // Update bestiary data using widget
    while (tablist[index].startsWith("§r ") && !tablist[index].endsWith("§r§3§lInfo§r")) {
        let beData = tablist[index++].removeFormatting().trim().split(' ');
        let levelData = beData[beData.length - 1];
        if (levelData === "MAX") continue;

        let name = beData.slice(0, -2).join(' ');
        let count = levelData.split('/');
        let now = unformatNumber(count[0]);
        let next = unformatNumber(count[1]);

        if (beCounter.hasOwnProperty(name)) {
            beCounter[name][1] = now;
            beCounter[name][2] = Math.max(next, beCounter[name][2]);
        } else beCounter[name] = [now, now, next];
    }

    // Sort by now - start
    const keys = Object.keys(beCounter).filter(key => {
        return beCounter[key][0] !== beCounter[key][1];
    }).sort((a, b) => {
        return beCounter[b][1] - beCounter[b][0] - beCounter[a][1] + beCounter[a][0];
    });

    // Update time if not empty
    if (keys.length > 0) beTime += 1;
    else return;

    // Set overlay message
    let message = '';
    keys.forEach(key => {
        let kills = beCounter[key][1] - beCounter[key][0];
        let rate = kills / beTime;
        let next = (beCounter[key][2] - beCounter[key][1]) / rate;
        let max = ((maxBestiary[key] ?? 0) - beCounter[key][1]) / rate;

        if (message !== "") message += '\n';
        message += `${GOLD + BOLD + key}: ${WHITE + kills} (${(rate * 3600).toFixed(2)}/hr)`;
        message += `\n ${YELLOW}Next: ${GRAY + formatTime(next, 0, 3)}`;
        message += `\n ${YELLOW}Max: ${GRAY + formatTime(max, 0, 3)}`;
    });

    bestiaryOverlay.setMessage(message);
}).setFps(1), () => settings.bestiaryCounter);
