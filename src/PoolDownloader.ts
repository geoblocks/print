
/**
 * Simple proxy to the fetch function for now.
 * Can be updated later to limit the number of concurrent requests.
 * Can be made to work on stub for testing.
 */
 export class PoolDownloader {
  private fetcher: typeof fetch;

  constructor() {
    this.fetcher = typeof fetch !== "undefined" ? fetch.bind(window) : null as unknown as typeof fetch;
  }

  fetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
    return this.fetcher(input, init);
  }
}
