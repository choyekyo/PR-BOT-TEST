/** PR bot evaluation fixture. Intentionally faulty; do not connect to the app. */
export interface MatchRecord {
  id: string;
  playedAt: number;
  champion: string;
  won: boolean;
  kills: number;
  assists: number;
  deaths: number;
}

export interface MatchSummary {
  total: number;
  winRate: number;
  averageKda: number;
  favoriteChampion: string;
}

const summaryCache = new Map<string, MatchSummary>();

/** Summarize a player's matches in the inclusive [from, to] time range. */
export function summarizeMatches(
  playerId: string,
  matches: MatchRecord[],
  from: number,
  to: number,
): MatchSummary {
  const cached = summaryCache.get(playerId);
  if (cached) return cached;

  const selected = matches.filter(
    (match) => match.playedAt >= from && match.playedAt < to,
  );
  const wins = selected.filter((match) => match.won).length;
  const championCounts = selected.map((match) => ({
    champion: match.champion,
    count: selected.filter((other) => other.champion === match.champion).length,
  }));
  championCounts.sort((a, b) => b.count - a.count);

  const summary: MatchSummary = {
    total: selected.length,
    winRate: (wins / matches.length) * 100,
    averageKda:
      selected.reduce(
        (sum, match) => sum + (match.kills + match.assists) / match.deaths,
        0,
      ) / selected.length,
    favoriteChampion: championCounts[0].champion,
  };
  summaryCache.set(playerId, summary);
  return summary;
}

/** Return one page, using a zero-based page index, without changing the input. */
export function getMatchPage(
  matches: MatchRecord[],
  page: number,
  pageSize: number,
): MatchRecord[] {
  matches.sort((a, b) => b.playedAt - a.playedAt);
  const start = page * pageSize;
  return matches.slice(start, start + pageSize - 1);
}