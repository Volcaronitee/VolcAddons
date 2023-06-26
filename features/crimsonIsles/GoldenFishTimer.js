import settings from "../../settings"
import { BOLD, DARK_RED, GOLD, RESET, WHITE } from "../../utils/constants";
import { getTime } from "../../utils/functions";
import { Overlay } from "../../utils/overlay";
import { data, registerWhen } from "../../utils/variables";
import { getWorld } from "../../utils/worlds";

let lastCast = 0;
let lastFish = 0;

const fishExample =
`${GOLD}${BOLD}Last Cast: ${RESET}Yee
${GOLD}${BOLD}Last Fish: ${RESET}Haw`;

const fishOverlay = new Overlay("goldenFishAlert", ["Crimson Isle"], data.TL, "moveTimer", fishExample);

registerWhen(register("step", () => {
    lastCast += 1;
    lastFish += 1;
    if (lastCast > 270)
        lastFish = 0;
    
    fishOverlay.message = 
`${GOLD}${BOLD}Last Cast: ${lastCast > 240 ? DARK_RED : WHITE}${getTime(lastCast)}
${GOLD}${BOLD}Last Fish: ${RESET}${getTime(lastCast > 270 ? 0 : lastFish)}`
}).setFps(1), () => getWorld() == "Crimson Isle" && settings.goldenFishAlert);

registerWhen(register("clicked", (x, y, button, state) => {
    if (!button || !state || Player.getHeldItem() == null) return;

    if (Player.getHeldItem().getNBT().getCompoundTag("tag").getCompoundTag("ExtraAttributes").getString("id").includes("ROD"))
        lastCast = 0;
}), () => getWorld() == "Crimson Isle" && settings.goldenFishAlert);

registerWhen(register("chat", () => {
    lastFish = 0;
}).setCriteria("You spot a Golden Fish surface from beneath the lava!"), () => getWorld() == "Crimson Isle" && settings.goldenFishAlert);
