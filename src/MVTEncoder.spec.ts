/* global test, expect */

import MVTEncoder, {PoolDownloader} from './MVTEncoder';
import VectorTileLayer from 'ol/layer/VectorTile.js';
import VectorTileSource from 'ol/source/VectorTile.js';
import fs from 'fs';
import pixelmatch from 'pixelmatch';
import png from 'pngjs';
import {Buffer} from 'node:buffer';
import {Extent} from 'ol/extent';
import {MVT} from 'ol/format.js';
import {fromLonLat} from 'ol/proj.js';
import {mockFetch} from './__mocks__/PoolDownloader';

PoolDownloader.prototype.fetch = mockFetch;

const tolerance = 0.005;

function parsePNGFromFile(filepath: string): Promise<png.PNG> {
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filepath);
    stream.on('error', (err) => {
      // @ts-ignore 2339
      if (err.code === 'ENOENT') {
        return reject(new Error(`File not found: ${filepath}`));
      }
      reject(err);
    });

    const image = stream.pipe(new png.PNG());
    image.on('parsed', () => resolve(image));
    image.on('error', reject);
  });
}

function parsePNGFromDataURL(filename: string, dataURL: string) {
  if (!dataURL.startsWith('data:image/png;base64,')) {
    throw new Error('Bad dataURL: ' + dataURL);
  }
  const data = dataURL.substring('data:image/png;base64,'.length);
  return new Promise((resolve, reject) => {
    const buffer = Buffer.from(data, 'base64');
    new png.PNG().parse(buffer, function (error, data) {
      fs.writeFileSync(filename, buffer);
      if (error) {
        reject(error);
      } else {
        resolve(data);
      }
    });
  });
}

function parsePNG(filename: string, dataUrl: string): Promise<png.PNG> {
  return dataUrl
    ? parsePNGFromDataURL(filename, dataUrl)
    : parsePNGFromFile(filename);
}

async function checkImages(
  prefix: string,
  actual: string,
  expected: string
): Promise<number> {
  const [actualImage, expectedImage] = await Promise.all([
    parsePNG(`test_results/${prefix}_actual.png`, actual),
    parsePNG(`test_results/${prefix}_expected.png`, expected),
  ]);
  const width = expectedImage.width;
  const height = expectedImage.height;
  if (actualImage.width != width) {
    throw new Error(
      `Unexpected width for ${actual}: expected ${width}, got ${actualImage.width}`
    );
  }
  if (actualImage.height != height) {
    throw new Error(
      `Unexpected height for ${actual}: expected ${height}, got ${actualImage.height}`
    );
  }
  const count = pixelmatch(
    actualImage.data,
    expectedImage.data,
    null,
    width,
    height
  );
  return count / (width * height);
}

// Resolutions are not round numbers
const r10 = 9.554628535647032;
const r20 = 19.109257071294063;

test('encodeMVTLayer with immediate API', async () => {
  const encoder = new MVTEncoder();

  const mvtLayer = new VectorTileLayer({
    source: new VectorTileSource({
      format: new MVT(),
      url: '/tiles/{z}/{x}/{y}.pbf',
      maxZoom: 14,
    }),
  });

  const printExtent = [
    ...fromLonLat([6.57119, 46.51325]),
    ...fromLonLat([6.57312, 46.51397]),
  ] as Extent;

  MVTEncoder.useImmediateAPI = true;
  const results = await encoder.encodeMVTLayer({
    layer: mvtLayer,
    canvasSize: [56, 30],
    styleResolution: r10,
    tileResolution: r10,
    printExtent,
  });
  const expected =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAAeCAYAAAB5c901AAAABmJLR0QA/wD/AP+gvaeTAAAEBklEQVRYhe2WTUxcVRiG3+/cOz/g/IGRMtPSH2zRiIowwCBJ7ZBIiImNC1PThTXBNJKmtWtNXODSuBO1gFGqiT+pqZrgD7Y1ZUGFDjPQmLCoErQ1wFBnhjIzBe6duedzUVHShKjhXmYWfbfn5H3uk5NzvksoUBr6Y88R84Bd0atGj7amrOIIq4r/LZ659BcAkrq0v2glp2CCw91teQb1gnHi0JkzilWcggkCAIH7AWz7NbXnaasYBRWMdTUmCPwpg05axSioIABAogeEtqb+SK0V9QUXjB5rmgRjxGDlZSv6Cy4IACD0EPhI89uX7zW7uigE3fOZLwEkDbvSaXZ3UQhaOTKKQhD4Z2TMLFYfNLO3aARjXY0JBn0ChqmPTdEIAoBCRg8IbY2nxh82q7OoBMdfar4CxgiEeadIZhX91zzw/ojblXc+xCwrAAUMSmR0fWr6ZEsaAIJ90UMATis5Y2fkRCi5Wd6WCja8G9tPCj9jU2i3x66qRKC0ZuRzhnFdCjE4MTs4HMYBkfG7ZxjUM9EVfHOzTMv+4u9MU2/kCRJ49f6y0pqGgCfRUFma2FdektnmcgoCHrm5kg8FPPvmf8y0zvjdcUVAdsx9/d5Hm+VuyQmG3hrzGE7ls71lJd4XHvNfeLK6fM4mwGvrF3+7WfnBxHz7z6llPaeIw5Od9Ynw6WHHcGfb6mbZW/LI6KrSrJIIPl/n/6Fjb/nsejkAaNvtix8Nbj9nI3qU9HwLXgeZIQdskaAQ1OItUf/Yv9MdXwMu56Qtm5P2tT0HdnkWfCW2BUFKKOiPmXZ1tmZMCJS57GpWCIUB4JfkcsXAZPz42akbz67fVmoTWQA+M9GqmWUbhfOcTGv5sm+vJsPxW1pjVjeqnaoyFw74Pl+/L6sbHganYvMZ3qjr/8ZSwfDARWda87QLIdvTK7maifl04MGKeyItVd6zzQH39Pq9Q9OpwJKWryDiUSAszfoG8wW7WQT9sVYCH8nodJiIbVKKIQKPTadW1VCVb6y+0n1d4vb9kAC+n05t//BKvCNnICIcMoJuMk3w7zFR+86Uy2FfrVdYOgwINzGrALwMEsRcxkQKEXsA2IjZxUROMEoAlDLIQcwuEGwAqgCUg3AOjI8BfBXralwO9kVDBLyyw+vcscvjuFbpsS8KEryQ1X3XFlf2/J7WFvKENyZmBy+hu9s8wWBv9DUibmfQ4wBsAAwAaQA5AFkAqwBWwFhmIo3A2b/WlggsmWgREhLAEoAcgRM624d+OlZ3405Y3anxZkWIp+yCa1wO1QkQbmmGpkljRkh8F134ZtRMuduCfdEYCOelFOe9jqVLZs2fjRLsi5YapNRA5u9jg0ghSmrsvDp1vDZrJfdu7qZI8yfio49mmBhiyAAAAABJRU5ErkJggg==';
  const value = await checkImages('mvt_imm1', results[0].baseURL, expected);
  expect(value).toBeLessThanOrEqual(tolerance);
  expect(results.map((r) => r.extent)).toStrictEqual([
    [731501.5247058513, 5862982.857784151, 731716.3713230825, 5863099.32407374],
  ]);

  MVTEncoder.useImmediateAPI = true;
  const results2 = await encoder.encodeMVTLayer({
    layer: mvtLayer,
    canvasSize: [28, 15],
    styleResolution: r20,
    tileResolution: r20,
    printExtent,
  });
  const expected2 =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAPCAYAAAD3T6+hAAAABmJLR0QA/wD/AP+gvaeTAAACoElEQVQ4jb2TS0hUURjH/985984dZ3LuVXyng9k7wUdOWgSKhT02UpSzrU25kBaBEbRq0a6oXaTRUooJgllGi5TBonSssKmBsgeamY466jjO495zWoQg0cAk1tl+3/f7cc75f4R1ng6fj3+ar/ooQbdHOhuuZzvH1it86PVaIPQSZFeHz8f/uRAAIHEXQNFYdGv7fxEGOz0RCbpPUl7Idob+VlLVM6wbgvaDoYGkcEkhGHHWbZFsen2+cWhDhbU9w0cUQrfK2I48jc/ZFZZYSFmupaTYJqT4DOBksNMT3hBhY2/wKCAv7ypwytN7Cp/Xlm6aYYA0BVjf6FRb4OvCsfl48oHJ+LWRcw3vM3GySlfdrVcGVHFpd6HTdaa+ZOBwVf5kvl1JuzTFNOxK2lPmGns7HWuJpWR5PGV9qTx0NjTx+J75J1ZWoeEOq15TWElNifNDs9v4oTLItXWHysyWSsOf71BXVI6aFQcrz8TKSiiJylw2Louc2tKq7MXEwnZ/ONK62tO+syBQrtteaio3CDY9E0vJSmgJRkQyJYXmD0dax+YTzQlLlBQ61CCAp6t9HCQIRJKlM2ZDAYADN5/lrOTkFHNmccnIICEVRjJXSNIAOCBEbTRp1ryZXGxz6/bl8lxt8KBbD7h1+9xaWCRhGom0+MbSViyjcG9PcDAF2cRhcQAg8et7hCQAWARgSc4W06bgsaQItW7RfZ5SPfI7yP9+1v19KVlhCutJEq7xjEIiGWAQV2DSuKnxhJlUVkQBXw55q1NrHpU8d4ZPhWfj3b3B6WarHgP7NuuzDIAA8OjdTGXf6PTxmVgqDIH+UFd1xhtmvYfVV0M2rXj5hKrwi3aFVeTnKFMOG49H42ZeNGkVpYXol5LdGDLqRuAlKxPnJ0rfEEKyDlHnAAAAAElFTkSuQmCC';
  const value2 = await checkImages('mvt_imm2', results2[0].baseURL, expected2);
  expect(value2).toBeLessThanOrEqual(tolerance);
  expect(results2.map((r) => r.extent)).toStrictEqual([
    [731501.5247058513, 5862982.857784151, 731716.3713230825, 5863099.32407374],
  ]);
});

test('encodeMVTLayer with render API', async () => {
  const encoder = new MVTEncoder();

  const mvtLayer = new VectorTileLayer({
    source: new VectorTileSource({
      format: new MVT(),
      url: '/tiles/{z}/{x}/{y}.pbf',
      maxZoom: 14,
    }),
  });

  const printExtent = [
    ...fromLonLat([6.57119, 46.51325]),
    ...fromLonLat([6.57312, 46.51397]),
  ] as Extent;

  MVTEncoder.useImmediateAPI = false;
  const results = await encoder.encodeMVTLayer({
    layer: mvtLayer,
    canvasSize: [56, 30],
    styleResolution: r10,
    tileResolution: r10,
    printExtent,
  });
  const expected =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAAeCAYAAAB5c901AAAABmJLR0QA/wD/AP+gvaeTAAADlklEQVRYhe2XS2xUZRTHf+feeVX7sBgo1rYJjSGaYgztzFC6ahfoRuODAD5CDMa0QdAEN0YgiIkribqoje0kptVESaoUY1wYWNgFz+kdMZoGIohNLdBiZ0gf1mEe33EhSjWoNb3zWPS/u+ee/P/3l/PlO7lCgdQYiW0W1V6fnao9+XxLIlc5Vq6M/0vll6cHgHjK+J7LZU7BAAf3t2UU6UbZuam/385VTsEAAQSNAFU/JlY9nKuMggLGOoKTgh5U5KVcZRQUEABDJ0JbKBJtyIV9wQGd7aEzKMeyar+YC/+CAwIgdAq6Nfzu6Tvdti4KwLIrM4eBeNZnb3PbuygAc7kyigIQbq6Mi9fqH3HTt2gAYx3BSUU+RnH1sikaQABbsp0IbcH3hta45VlUgEPt4W9QjmG5N0Vxy2ihWvv+19VW2mwE7r1ROofwaawjeAWgqcfZBPTZ6WxddOe6+GLz8jrBxp7YbjtjRgJee099ZSC0alkgHPDae0QYaYo4r8LNlZHxelz5y/C4YbIQhSLOXkF3b25Y/sGuljrHAgUwIO+cGA32D/+8LxRx7MH24BuNPbFOC/MQcGCxuXk5oqGuaK16rQtPr6nq27W+JnarnrdPjQUPfjfxrKTNPUMvhMZa+wb9g9vakovNzssRNR7r8RKPlfgnOICXm2ucEo+VMLb1GCLqBhzkCVDQ1VWlvrH5tbm08c6mjW9+bcXt/ksqstrN7PxMEEt13vP5+NyK3jPjOw4NX934906Rv7QuWnm5ZET1+4nZ1JbPzyVaR6bm1s2msvUBj325tfqOT+b3TfySqcFw3s3snAK29n4VmL5evgFLH0xmzPIjF+OPhu8uP9VcW3EoXF12YX7vgeOjoWQmW+mxM4fd/Ab3Afer1XRXrEXQrTMpeVJEvShfINaH0UszW2rKAyNP3V/1wx/taYO8deKn8MDZyWdEee10e/PYv9n/X/25Jhq6hkv9vuRaW40/i1Umqh6gQhFLVCtVxBbRcsArqqUqEkApAW5TxC+qpQheoBZYhnAE5SPgs1hHcA6gqdt5BZHXAx6ZWlnmGwUYn0nVJTNaIZh9TkfoTTfhAKSp29krohsUWQ94gSwwDaSBWSAJ/IoypyLXBZ298W5KUKMi1zAYYApICzqZUt+X325/4OqtAkNd0ZXGaz2hKvcBiOhZK20GhnaEx92G+x2wx4khHDXGOlrhnzru1v5Z0pKWtCD9BlnCWOFgJziOAAAAAElFTkSuQmCC';
  const value = await checkImages('mvt_rend1', results[0].baseURL, expected);
  expect(value).toBeLessThanOrEqual(tolerance);
  expect(results.map((r) => r.extent)).toStrictEqual([
    [731501.5247058513, 5862982.857784151, 731716.3713230825, 5863099.32407374],
  ]);

  MVTEncoder.useImmediateAPI = false;
  const results2 = await encoder.encodeMVTLayer({
    layer: mvtLayer,
    canvasSize: [28, 15],
    styleResolution: r20,
    tileResolution: r20,
    printExtent,
  });
  const expected2 =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAPCAYAAAD3T6+hAAAABmJLR0QA/wD/AP+gvaeTAAACU0lEQVQ4jb2UT0jTYRjHv8/7+/3cnxTtj05kjkoawTqUNk2DIjp0iSjCHepsO0iEdKjWH+0SlNStSCvoEsGipFuedrAJ2rZDEAlOQZ2YINO1ZD+33+99OqxgiG3TqOf2Pu/zfD7vC8/7ErYYncGgMr28N86gJzF/S3+5fWKrwjc+nwnCIIG7O4NB5Z8LAQCMZwDqplaazvwXYdR/eIlBr4n5crk9tFnJoRexBpGT5wHs/5VKgXCdBR2MdbV8LtWvbkbWPBANCEP2WTQl2VCpzTKBFtK5xjXTBEs8B9BailH2Db2DkVsEBHye2lc9Ha6IABgAJEB9oenO4fjySRDfG+/y3vxroffxeCNrIn7hgONlT7szun5fSogrw5P9Y4mUDTne86m7de5PrLKGRqrinE0VyY1kACAE5KmmHUNWVdGlIs4WY5UlJLDbUVmRKMyNJVL73k8snfi9Pu3e+bFum2WCidzFWGUNjYRgBpDM5OwjM6m2qWX9mG7K+lq7FgUQKqwkYi4pbH80asvYbA5FmAoLqiHJqiCukkwWAHYCahZ/ZD0D0YX7qkDGWWUJH3VVj7iqrclC2OKq4YTEZFFh80A0nAW3KTAVACCZP6BkAoDvAEwGp3WDLZmcEbp9fPdbTQhzPag/POvVDXO7qhhDRYVEPCIgAzBozrAourGmZuQuZfWLz5MtLPQORm58iK/02rX5masdjeOayD+LnAQ9HJ1rffd16SIxescuHUlsrMrHpn6alqeRayC6a1UpVV9VMQsA39JZl25wNUHeifi9D0oxfgIpY+NN0lICtAAAAABJRU5ErkJggg==';
  const value2 = await checkImages('mvt_rend2', results2[0].baseURL, expected2);
  expect(value2).toBeLessThanOrEqual(tolerance);
  expect(results2.map((r) => r.extent)).toStrictEqual([
    [731501.5247058513, 5862982.857784151, 731716.3713230825, 5863099.32407374],
  ]);
});
