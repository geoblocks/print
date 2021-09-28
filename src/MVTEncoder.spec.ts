/* global jest, test, expect */

import MVTEncoder from './MVTEncoder';
import VectorTileLayer from 'ol/layer/VectorTile.js';
import VectorTileSource from 'ol/source/VectorTile.js';
import {Extent} from 'ol/extent';
import {MVT} from 'ol/format.js';
import {fromLonLat} from 'ol/proj.js';

jest.mock('./PoolDownloader');

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
  const results = await encoder.encodeMVTLayer(mvtLayer, 10, printExtent);
  expect(results).toStrictEqual([
    {
      'baseURL':
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAAeCAYAAAB5c901AAAABmJLR0QA/wD/AP+gvaeTAAAEGUlEQVRYhe2WX0xbVRzHv79ze1soLYWNbVBBkUwTQWVYygBNLA9zLyx7MCyYuIctUyBO4uKDD+4BE+OLT44ZBj6wmOgSyJyamRhnMkI2GdAO1IAZIwxxK8goWFr67/aenw9aXfYwTbilfdj39Zz7/ZxPfsk5l5ChPNfnO0TM/WYlUTZyrHE1XRyRruL/Sr5//QsAgYQ0H00nJ2OCQ11NSQadAeN4y8CAki5OxgQBgMB9AHbdWn28OV2MjAr62mpXCHyOQZ3pYmRUEAAg0Q1Ck7tvrCod9RkX9Ha4J8C4orPyZjr6My4IACB0E/hw3enR7UZXZ4WgfTF0AUBANytHjO7OCsF0PhlZIQj8+2TMrVUcMLI3awR9bbUrDPocDEMvm6wRBACF9G4Qmmp7xp82qjOrBMdfr5sE4wqEcVMko4r+f5gwMCg80zsoVGIn32KIAY9EF0kAcPV6WwCcVTT90bHjewObpW2p4O5TNy0OS9AtQK1CYC/ANmYs6Cy+0WX868n2+l897w0poRL7HIO6r7e5PtwsM21/8ffH1estsqrxEyZFfLDLphZXF9vnKndYF3LNSl5Ekwd1yfucE/7FH95unCk5sGQSkPv9Fz/5dLPcLZlgVdeU2erc6LCZze1N5YXXTjSWjtlUoafWR++EtveM33lp+m4kqkF/f/I194jn7JBl6EhTbLPsLZlgaeuxGlXglZrivD9OesqH75UDgNJ8S1QhWp8PxivDUV34564Oz7/arBnB3pJbVBH67iKruq1qp20hJRfRpBrWpDm158XyfP8jdvPvklGxJ/BEmVHsLREUwmQzm4RaZFU3AOBmILKzf2LpjfNTyy+n9uRb1KTdooRNJjIRJRxGsU1GFT04uqZLkzITiLpPjd4+FE7oFTkmxe9xFgymdkgAmg5Vl5BJUuJGkdMq6Om/nLMez98ndRxdjWgN82uxeMNjjpH6Msf5Oqd9NrVPAphe3nDcDceLwPIXa1z3G3UG4wW7WLhKfI0EPhxKUCsRq5L5+2gSF1fjmrPUrg7XFOctyXs+iWhS+erGylO3grFcIuEd7XSvG3WcfwSrPp6yWcyxGoWlRYewE7MJgINBgpgLmUgh4nwAKjHbmCgHjFwAVgZZiNkGggr4ygBsY6LvwOgA8OX1dndkT8/483Nr8Xc/una7ZXY1drn5ycLZglxLYmp5o+Dcz8vuyaXQs5GEPiiBC0bJAQC5znhPEvE+BjUAUAHoANYBaADCAGIAomBEmChO4PDfa0ECSyZag4QEEASgEXglweZvf+qoXr4f5ur1PkPgtwA6KIhUQZxMSuQwaF6AT4t48rPRznrDpveXYK/XB8IlKcUlhyV41YjH9cFhqu750UmkVSpEeazTbxuh6MyNd14IpZf7MA+TlfkT7FukHAOEEcsAAAAASUVORK5CYII=',
      'extent': [
        731501.5247058513, 5862982.857784151, 731716.3713230825,
        5863099.32407374,
      ],
    },
  ]);

  MVTEncoder.useImmediateAPI = true;
  const results2 = await encoder.encodeMVTLayer(mvtLayer, 20, printExtent);
  expect(results2).toStrictEqual([
    {
      'baseURL':
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAPCAYAAAD3T6+hAAAABmJLR0QA/wD/AP+gvaeTAAACo0lEQVQ4jb3TX0jTURQH8HPu/e33229tzflvSqaYaTIL8Q+aJYUQPYVWoPTQSw9mEPkaRA9Cj4UPEobVe7B8EaIetcRAdGFGYKhLUdPV3NzUbe73u/f0EJOIFkus+3rP+X4u596LsMfV7vVyf/jIHAH2v+uqu59pH9sr+LyjQwDCYwS62e718n8OAgAAwRMAyJ/fKGv9L6Cvqz5IgM+Q6FamPfi3SJF3SS+IrleSMEs4B5swRQGg8sBgcHa6s250/8CeHlbtPl+ocrVN4azZZVXcCkNNEhkbcfN4zKAFzkTnxPWGqX0BKx+O5zhVS7fDyi6XZ+uLntwDiy7dsh0zhfp+davBH040BuPJQUPyu1M3ambT5SiZYEf7Xmo2VWlSFbraUpo10t14eNJuYSK1H92Rs/feLFRNB6g5FDM7geg2INLvsjJ6NNksx64yaC2wa99+xQAADmrMaDpkf+HJ1YOEcKGqf8KdLisj0NAtmsLwREWO7k9h48uR8qGZYEuq5qIn/3XrsbxBBqCrHCrSZWU0UlUmGXJNtypcDs0EW+bDiTMJIQvybBYfAAynTm63cgMRBALY/gg29b7V47ru5kxwYpiFkhSG5JCEGgDYTIBCTpD7KRi7oim4VeTQxk4XO0eLndbQ7hQk4HIk6SAJXBAG0oK1A76xJFAjB8EBAFD+uGtJCAAQBQBBEiNJkolQwvxyrszVX+N2hH4OkQCwEo3rw5/XPYS0YjXEfFoQkUYZyDtg4pKp8YS5o8RlLt/+2FGV3K3qGVaq3fbaUNzoe+pba26rMCZPlWQFbBYmDEOyqa+brldz4coPgVgpED0a7z4ZTQdm/A/rBiZthHhJZXCtNEu3FDvVNbumbMcNoa1uJvP94YQaM8SIJOj1ddVH0uV8B4j+DwOBcp5dAAAAAElFTkSuQmCC',
      'extent': [
        731501.5247058513, 5862982.857784151, 731716.3713230825,
        5863099.32407374,
      ],
    },
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
  const results = await encoder.encodeMVTLayer(mvtLayer, 10, printExtent);
  expect(results).toStrictEqual([
    {
      'baseURL':
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAAeCAYAAAB5c901AAAABmJLR0QA/wD/AP+gvaeTAAADoklEQVRYhe2VS2icVRiGn+//5xYzM0mstU2aEBulFFNamplJL6tELCJqKYriwixaY9IYFQRx5SKL4kJxYxSToRjpQqFS4xWKXbTQWImdn7FqrKLYTemUNGnMbTKZmf98LiwaSvFC/8nMou/2HN7nPHxwPqFMaUs6T4jqSMDON33dvftqqThWqYr/LdFLcx8B03kTOFBKTtkETw10FhUZQnnu8aNH7VJxyiYIIGgSWHfh6saHS8Uoq6DTG58S9ANFXigVo6yCABgGEToTyW9aS1FfdsFUXyKNMuaq/Xwp+ssuCIAwKGhX+1vja7yurgjBSGZ+FJh2A/Z+r7srQrCUK6MiBOHvlfHbTMsjXvZWjKDTG59S5H0UTz+bihEEsMUdROiMv3N2i1edFSV4tqf9W5QxLO+mWFGCAAiDijzl1crweVHyf7L1yLlq/1LhaVtkH6LNQNYo466xhtIH21KRzPzofH3kjaLfdwB4/WZ5qzrB2HBqcyhX+D5oWwPb1oeLD95zx5n7Ntadrw8HE5boeCKZevXayhi0MA94wRQvSv5Lth45Vx3MFX7cEA1NDz20aWRd2L+88vxwOtOaTGV6jeqLTk9sqOO9U8FT+ztzN8tdtQkGlvI9fluqD+/d9O71cgDd2+sn7r+77hNLOBRLOj4v5GAVBW1L9m5ZW+2sqfLnAbIF418omMDKO8/GG84YlVpgh1fcVRNUpLEhErgC8Mt09s6R9OX+YxOTj6280xgNLgVsmRXRRq+4q/aLipKfzBbvfXP84q6FvNsS8tmXOhpqP1x5x4C4RkPGWItecUsq2DFyMjS3HN0jol1F1c0XZnLujg3R0zubao61N0R+vf7+pz9daXZVQ367mPbqDd4LDqgVq3d2C9o1n5cnRdQPfI7h5cnF/Gt5Y364kdxCwfiSTuZRS+T4+DM7L3r1nL8EW9+eCAcDue22mqCLFRFVH1CjiCWqdSpii2gU8ItqWEVCKFXAbYoERTWM4AenCbhdRb5E6QM+dnrjWYC2YaduOJV56eep7Bf9iYaxu2qrFgsGGT0/2TKSvrxvOluIGjjolRyAxIZSr4joHkV2AX7ABeaAArAA5IAllKyKLAu6cO1sVlCjIjMYDDALFASdymvg+Hd92yZvBIwNp7ot4ZBRWRu05feiMVWuErJEPrOk0O/l9P4UHE45CCeMsU7UBGe/8mr//FM6Bk76ZtfXJGzLbTbGWhTRlNMbz5Saeyu3UoH5A9WQbTLT6CMQAAAAAElFTkSuQmCC',
      'extent': [
        731501.5247058513, 5862982.857784151, 731716.3713230825,
        5863099.32407374,
      ],
    },
  ]);

  MVTEncoder.useImmediateAPI = false;
  const results2 = await encoder.encodeMVTLayer(mvtLayer, 20, printExtent);
  expect(results2).toStrictEqual([
    {
      'baseURL':
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAPCAYAAAD3T6+hAAAABmJLR0QA/wD/AP+gvaeTAAACV0lEQVQ4jb3TzUtUURgG8Oc9Z+7cGafRIVNLBzVDEQwhHT+iCG1biAn6D1jNQooCN7ULXBlUq2w0ktwE06IMiqBFC7UQvYmEJZQtVMopzY907nhn7ntahCDR1Gjl2b7P+/wW5xzCNk9zOCw/LBa9V6Cbr4KVV1PdE9sF77e02CB0E1Rbczgs/zsIAFDoAZA9tXSgYUdAIxiYV6B7pNS5HQEBQDBfB1BX0WOUp5J3bBUo7xv3aGa8VRI1glQBgCgzIrDVFQCn/rRPW8EqQ6OlkvDEIYSvLNszmuvVI+u2rb+ORKvnVq0CAb4xEqy6+E/A8r5xjx6Lv8lLdy3cOlHSm7NLW9+YMUO0P5vqHJpedttKnTeCga5kPSnfodO0zmqSPLcbSu5sxgBACPDx/b6HgTzvO0HoqAyNan8NSkENB7M8RqZbswBgeHa5uH9yvn5jfrIkc/DS0fwQK/IBqEnWk/KjUSB/jtc51j85Xz+1GDsWs3lvVppmAHi+kfGn66ZT0nKc2f9b8PC1F27T7c6RwpZKkI9YOQQpLyvSAaQBSCPQ7pklq8nrjK76vfrQkfyMgfwM19fNZQyQzcrFLNaSghUhY8iCqpGwJQAQqx/LigBgBYANYDHBbC6Y1sqF2uJOTQj7V2WPJr8U2Eq5NJkYSwoSqQEBvowEzSR0GUusO0zeI9cmWsqszcFA10j1x2/Wy7vjkdLTh/ZN/Fy0GmdHt/GpSRA9HT5TO5sM3NI/rAgZHYLQXleY8bitKnew0OdeizPowdvPRb1jc40L0Xg6AzVGMDCdrOM78DrkaBERaH4AAAAASUVORK5CYII=',
      'extent': [
        731501.5247058513, 5862982.857784151, 731716.3713230825,
        5863099.32407374,
      ],
    },
  ]);
});
