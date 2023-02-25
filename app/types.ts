export interface Game {
    appid: number,
    name: string,
    type: string,
    tags: string[],
    platform?: string,
    gameId?: string,
    progress?: number,
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

export interface SteamGridDBImageData {
    author: {
        name: "QuiGonJinnah",
        steam64: "76561198045337884",
        avatar: "https://avatars.akamai.steamstatic.com/7505e767c82d1ea4f68f53cea518a12ba3a2f946_medium.jpg"
    },
    downvotes: number,
    epilepsy: boolean,
    height: number,
    humor: boolean,
    id: number
    language: string,
    lock: boolean,
    mime: string,
    notes: string|null,
    nsfw: boolean,
    score: number,
    style: string,
    thumb: string,
    upvotes: number,
    url: string,
    width: number
}
