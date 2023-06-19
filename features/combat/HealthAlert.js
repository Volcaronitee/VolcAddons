import settings from "../../settings";
import { BOLD, DARK_RED, RESET } from "../../utils/constants";
import { registerWhen } from "../../utils/variables";

let player = undefined;

registerWhen(register("step", () => {
    if (player == undefined) return;

    if (player.func_110143_aJ() / player.func_110138_aP() < settings.healthAlert) {
        Client.Companion.showTitle(`${DARK_RED}${BOLD}WARNING: HEALTH BELOW ${RESET}${Math.round(settings.healthAlert * 100)}%${DARK_RED}!`, "", 0, 25, 5);
    }
}).setFps(2), () => settings.healthAlert);

register("chat", () => {
    player = Player.asPlayerMP().getEntity();
}).setCriteria("{${data}}");