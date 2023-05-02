import Epic from "./Epic";

interface Importer {
    id: string;
    name: string;
    official: boolean;
    class: any;
    games: [];
    grids: [];
    posters: [];
    heroes: [];
    logos: [];
    installed: boolean;
    error: boolean;
}
const importers:Importer[] = [
    {
        id: "egs",
        name: "Epic Games Launcher",
        official: true,
        class: Epic,
        games: [],
        grids: [],
        posters: [],
        heroes: [],
        logos: [],
        installed: false,
        error: false
    }
];

export default importers;
//
