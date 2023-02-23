export interface Game {
    appid: number,
    name: string,
    type: string
    platform?: string,
    gameId?: string,
}

export interface ShortcutFile {
    userdataPath: "string";
    shortcutPath: "string";
}
