import getSteamGames from "./getSteamGames";
import getNonSteamGames from "./getNonSteamGames";
import {Game} from "../types";

const getGame = async (appid: number):Promise<Game> => {
    const steamGames = await getSteamGames();
    const nonSteamGames = await getNonSteamGames();
    const allGames = [...steamGames, ...nonSteamGames];

    return allGames.find((game) => {
        return game.appid === appid;
    });
};

export default getGame;
