const Registry = window.require("winreg");
const memoize = require("fast-memoize");

const getSteamPath = ():Promise<string> => {
    return new Promise((resolve, reject) => {
        const key = new Registry({
            hive: Registry.HKCU,
            key: "\\Software\\Valve\\Steam",
        });

        key.values((err, items) => {
            const steamPath = items?.find((item) => item.name == "SteamPath")?.value;

            if (steamPath) {
                return resolve(steamPath);
            }

            // @todo This is never handled anywhere
            return reject(new Error("Could not find Steam path."));
        });
    });
};

const getSteamPathMemo = memoize(getSteamPath);

export {getSteamPath};
export default getSteamPathMemo;
