import fetch from 'node-fetch';
// @ts-ignore
global.fetch = fetch;
import fs from 'fs';

export function mockFetch(
  input: RequestInfo,
  init?: RequestInit
): Promise<Response> {
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
  // @ts-ignore
  return fetch(input, init);
}
