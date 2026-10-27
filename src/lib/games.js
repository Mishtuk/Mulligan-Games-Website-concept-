// The fixed game list (D7): ids, names and short labels live in src/content/games.json; admin only toggles `shown` (later task).
import games from '../content/games.json' with { type: 'json' };

export const GAMES = games;
export const GAME_IDS = new Set(games.map((g) => g.id));
