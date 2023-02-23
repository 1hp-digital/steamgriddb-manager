const Registry = window.require("winreg");

let cache:string;

const getSteamPath = ():Promise<string> => {
    return new Promise((resolve, reject) => {
        if (cache) {
            return resolve(cache);
        }

        const key = new Registry({
            hive: Registry.HKCU,
            key: "\\Software\\Valve\\Steam",
        });

        key.values((err, items) => {
            const steamPath = items?.find((item) => item.name == "SteamPath")?.value;

            if (steamPath) {
                cache = steamPath;
                return resolve(steamPath);
            }

            // @todo This is never handled anywhere
            return reject(new Error("Could not find Steam path."));
        });
    });
};

export default getSteamPath;
