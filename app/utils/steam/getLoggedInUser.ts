import SteamID from "steamid";
import getSteamPath from "./getSteamPath";

const fs = window.require("fs");
const {join} = window.require("path");
const VDF = window.require("@node-steam/vdf");

let cache:string;

const getLoggedInUser = async ():Promise<string> => {
    const steamPath = await getSteamPath();

    return new Promise((resolve) => {
        if (cache) {
            return resolve(cache);
        }

        const loginusersPath = join(steamPath, "config", "loginusers.vdf");
        const data = fs.readFileSync(loginusersPath, "utf-8");
        const loginusersData = VDF.parse(data);

        Object.keys(loginusersData.users).forEach((user) => {
            if (loginusersData.users[user].MostRecent || loginusersData.users[user].mostrecent) {
                const {accountid} = (new SteamID(user));

                cache = accountid;
                return resolve(accountid);
            }

            return false;
        });

        return false;
    });
};

export default getLoggedInUser;
