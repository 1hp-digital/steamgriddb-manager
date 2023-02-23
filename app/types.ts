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

export interface GameImages {
    grid: string|boolean,
    hero: string|boolean,
    logo: string|boolean,
    poster: string|boolean
}
