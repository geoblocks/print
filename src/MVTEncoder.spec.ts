import VectorTileLayer from 'ol/layer/VectorTile';
import VectorTileSource from 'ol/source/VectorTile';
import MVTEncoder from './MVTEncoder';
import {MVT} from 'ol/format';
import {Extent} from 'ol/extent';
import {fromLonLat} from 'ol/proj';

jest.mock('./PoolDownloader')

test('WorldToVectorContextTransform', async () => {
  const encoder = new MVTEncoder();

  const mvtLayer = new VectorTileLayer({
    source: new VectorTileSource({
      format: new MVT(),
      url: '/tiles/{z}/{x}/{y}.pbf',
      maxZoom: 14,
    })
  });

  const printExtent = [
    ...fromLonLat([6.57119, 46.51325]),
    ...fromLonLat([6.57312, 46.51397])
  ] as Extent;

  const results = await encoder.encodeMVTLayer(mvtLayer, 10, printExtent, 1/5000);
  expect(results).toStrictEqual([{
    "baseURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGsAAAA6CAYAAAC3badeAAAABmJLR0QA/wD/AP+gvaeTAAAEXUlEQVR4nO3ZTWwUZRzH8e//mVlKC5QmmCgaE0U9GIy87C5V0AtBg8ELJsXQBIgiLI3IgbMHzh48kBYoLwdsFFP0ghpJDHIRxHaHKgkXAjbBRCOpApWyZbvz/D1QtNa29A2eXeb5JHvbZL8zv+zOZEdIiHRrvgb4BdgZ5TKHXfdMhnEdcL9EucxNRQ4DO1y3TFZixgIQtAVYvPRA9ILrlslI1FhRLnMJ4bjEut11y2QkaiwAQZsRGrItHY+4bpmoxI2V35I5DnTblNnqumWiEjcWIqrIPpRt6dZ8ynXORCRvLKA6LBwCZqnKG65bJiKRY53a/NJfwMcilXWjkcixAIzYFmBFdn/HYtct45XYsTq3LjuPctJiKubbldixANRIM0rjsuYf5rluGY9Ej/VU3aVjwO+lVPi265bxSPRYR9eti4FWQd9taG8PXPfcTaLHGnQQeLj72pNrXIfcTeLHinKZHpRPFSn7G43EjwUgqrtRVmX2dj7numUsfiwg35TtEvSMNSbnumUsfqxBijQLuindmp/rumU0fqx/HQV6UTa6DhmNH2tQlMsMCHoQ4T12aVmel7KMciUOg/3AE+n50SrXLSPxYw3RtXnpr4p8LpTnv/F+rGGMtc2KrMnu6VzgumU4P9Yw+absKUHPWiNNrluG82ONRNiL8M7zH/00y3XKUH6sEaRuDBwB4rC/1Oi6ZSg/1gi+37m8gHBQVHegKq577vBjjUbZAzy7pLXrZdcpd/ixRhHlMpeBL4zYsrmN92ONwappBtYu2vvjY65bwI81pq7ckm+BC6EplcVjfz/WWERUrL4FfOU6xfM8z/M8z5uyMn0CPF4VHT8RS/dFb6bnR+dcd0xF6DrgXlty6OyjJraNqO5UpM11z1Q8kGMtbDk/uzp1c60iGyjZlcBllAOlmvAD121T8eCMtUtNen60XNANSmG9qlhFjgViV3duyZxARF0nTlXZPKuZrOz+joWq0qDIJuBxRU4atW0q8lmUy9x03TedKnKswetQA8oGIA1ECG0DcerIuaZFV1z33SsV8zP44oenq4uzZryOspGSXQ38hvBJQNzYsbX+guu++6G8xxpyHSoi6wGrIscCsa89KNehiZj2n8EVh76b03urNqxOFepKEgYoc4FUoHZ2jJkpqtVAjSJVgs5BCRHqBA3g9nsVmS3oTEXSwEMIXwvadq2/7suLO565Nd3NleJ/Y9XvPlNbqgpXKpIR0VpRrVKRf04qlgBhLre/lXOAKqBm8FV1l8+7DljgKhADvYIWLabPYAuK9At6AxgArivSHQzE7R3b6/+YxmOuWNLQ3h5c/PPpZcbYV4BXUeqBW4rkBb2iSGywvRZTFNE+Ue1XlYKI9llM0YjtVZXYiF61KrEa6RWrRRNrnw2kUIxn9M8IijeiXGbA9cFWuvDnqwt6jNhaUT2rKt+I6vuFeTWnz69bWHQd5/1XqCrbRPREPpftcR3jeZ7neZ7ned5o/gZ/E3+H+NlLFgAAAABJRU5ErkJggg==",
    "extent": [731501.5247058513, 5862982.857784151, 731716.3713230825, 5863099.32407374],
    "imageFormat": "image/png",
    "name": undefined,
    "opacity": 1}
  ]);

  const printExtent2 = [
    ...fromLonLat([6.571432528686469, 46.513080853023666]),
    ...fromLonLat([ 6.573048747601813, 46.514629276927366]),
  ];
  const results2 = await encoder.encodeMVTLayer(mvtLayer, 10, printExtent2, 1/1000);
  expect(results2).toStrictEqual([{
    "baseURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAAZCAYAAADXPsWXAAAABmJLR0QA/wD/AP+gvaeTAAABdElEQVQ4jeXSTSuEURjG8f8970Y0NZ9AicUUNRh2XrZKoazkLUNSPoCVL2AjyQylFCa+gY2VMj0zRM3KwspKiWkYwzzPbaUU84zO1rU7dZ1f59znCN/Su3HRXA367oG5/GL3CX+M5/siu9JXBDKCLv4V+IEAeMRJKzIU3823GiPWQsICrrBJGiMAgqYFnYkdFwLGSLkaPgAago9vo8ZIYTlWQskIumCMAKhXUgiDiXS2zRi5THblgUvb8dYdcE0EQJE0wmzrxm3QGKlUQ4eAPxJ6ch2wK1JYjpUUOVLE9Qe7IgAex0mh9HdvWe3GSG6p50qRnPqk5nPXRQA86qRQpgf2zkLGyHs4kAH8xY/mcWPkZqrzBTgQdN4MWdOvzjpw9ltFau1NbGajdsA7ibIqjo7llnrOa3V98Z18l9oSEdQvok1AGBi2YQTlAWW7HA1bbof1iaM5EQV4BSrAM2CJ6GhL5O70ZGLCdr0uQMf+dWPd0v/KJxp1eOjwAD9pAAAAAElFTkSuQmCC",
    "extent": [731528.5228757319, 5862955.497006967, 731708.4395423986, 5863205.969229191],
    "imageFormat": "image/png",
    "name": undefined,
    "opacity": 1}
  ]);
});