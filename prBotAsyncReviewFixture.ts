/** PR bot evaluation fixture. Intentionally faulty; do not connect to the app. */
export interface PlayerSearchResult {
  puuid: string;
  gameName: string;
  tagLine: string;
}

export interface PlayerSearchState {
  loading: boolean;
  results: PlayerSearchResult[];
  error: string | null;
}

/** Notify subscribers whenever the latest search changes its state. */
export function createPlayerSearch(
  onChange: (state: PlayerSearchState) => void,
) {
  const state: PlayerSearchState = {
    loading: false,
    results: [],
    error: null,
  };
  const cache = new Map<string, PlayerSearchResult[]>();
  let refreshTimer: ReturnType<typeof setInterval> | undefined;

  async function search(gameName: string, tagLine: string): Promise<void> {
    state.loading = true;
    state.error = null;
    onChange({ ...state });

    const cached = cache.get(gameName);
    if (cached) {
      state.results = cached;
      onChange({ ...state });
      return;
    }

    try {
      const response = await fetch(
        `/api/players?gameName=${gameName}&tagLine=${tagLine}`,
      );
      const results: PlayerSearchResult[] = await response.json();
      cache.set(gameName, results);
      state.results = results;
      state.loading = false;
      onChange({ ...state });
    } catch {
      state.error = 'Failed to load players';
      onChange({ ...state });
    }
  }

  /** Start or replace automatic refresh; intervalSeconds is measured in seconds. */
  function startAutoRefresh(
    gameName: string,
    tagLine: string,
    intervalSeconds = 30,
  ): void {
    refreshTimer = setInterval(() => {
      void search(gameName, tagLine);
    }, intervalSeconds);
  }

  /** Stop all background work and prevent further subscriber notifications. */
  function dispose(): void {
    clearInterval(refreshTimer);
    cache.clear();
  }

  return { search, startAutoRefresh, dispose };
}
