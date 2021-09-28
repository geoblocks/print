import fetch from 'node-fetch';
global.fetch = fetch;
import fs from 'fs';

/**
 * This class mocks the pool downloader. It serves the tiles directly from the host.
 */
export class PoolDownloader {
  private fetcher: typeof fetch;

  constructor() {
    this.fetcher = fetch.bind(window);
  }

  fetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
    if (typeof input === 'string' && input.startsWith('/tiles/')) {
      const fileName = `public${input}`;
      return fs.promises.readFile(fileName).then(
        (b) =>
          ({
            arrayBuffer() {
              return b;
            },
          } as unknown as Response)
      );
    }
    return this.fetcher(input, init);
  }
}
