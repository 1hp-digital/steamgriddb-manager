import getShortcutFile from "./getShortcutFile";
import generateAppId from "./generateAppId";

const shortcut = window.require("steam-shortcut-editor");

const addShortcuts = async (shortcuts):Promise<void> => {
    const shortcutPath = await getShortcutFile();

    return new Promise<void>((resolve) => {
        shortcut.parseFile(shortcutPath, (err, items) => {
            const newShorcuts = {
                shortcuts: [],
            };

            let apps = [];
            if (typeof items !== "undefined") {
                apps = items.shortcuts;
            }

            shortcuts.forEach((value) => {
                // Don't add dupes
                apps.some((app) => {
                    const appid = generateAppId(app.exe, app.appname);
                    if (generateAppId(value.exe, value.name) === appid) {
                        return true;
                    }
                    return false;
                });

                apps.push({
                    appname: value.name,
                    exe: value.exe,
                    StartDir: value.startIn,
                    LaunchOptions: value.params,
                    icon: (typeof value.icon !== "undefined" ? value.icon : ""),
                    IsHidden: false,
                    ShortcutPath: "",
                    AllowDesktopConfig: true,
                    OpenVR: false,
                    tags: (typeof value.tags !== "undefined" ? value.tags : []),
                });
            });

            newShorcuts.shortcuts = apps;

            shortcut.writeFile(shortcutPath, newShorcuts, () => resolve());
        });
    });
};

export default addShortcuts;
