import VectorTileLayer from 'ol/layer/VectorTile';
import VectorTileSource from 'ol/source/VectorTile';
import MVTEncoder from './MVTEncoder';
import {MVT} from 'ol/format';
import {Extent} from 'ol/extent';
import {fromLonLat} from 'ol/proj';

jest.mock('./PoolDownloader')

test('encodeMVTLayer', async () => {
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

  const results = await encoder.encodeMVTLayer(mvtLayer, 10, printExtent);
  expect(results).toStrictEqual([{
    "baseURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAAeCAYAAAB5c901AAAABmJLR0QA/wD/AP+gvaeTAAACQElEQVRYhe2XS0hUYRiGn+/MNdGRLhAtXBTtDCJnFHTlLKRNES26QLkwokGoFq1biMu2U6QSzCIqUKigoKiFLowoZygCt7WrCC84ienonLdF2mVjm/N3DuSz/eF9v+cczv9xjJBoG6mcNKmUjNVaXp7vmnPV47kK/huZj9X7wGzNT55z2ROa4MRAfk3YEOLiidHRmKue0AQBDI0Auz/M7T3iqiNUwUohN2PonrDLrjpCFQTAp4iRbx953eoiPnTBcn/7G8RkXbFLLvJDFwTAKBrq7bj+amfQ0ZEQbPr09QEwW0/G+oLOjoSgy5URCUH4tTLez+87GmRuZAQrhdyMsLuIQC+byAgCxKxexMjnbk4dCCozUoJTFzreIibxgnuLkRIEwCgKOxvUyoic4MbKWEvEA/nLiJzg+sooeviHw57FHZJ1l8bTYY+xxWZ0l8bT2eFyg+ueUL7BtluV/dVa5pGha6674q4LNsgOl3cJO+Xhn1FdncC0sCuue81leHdpPF1dyfSYqRc4BswCY8BYpZCbdNm9QfCCA/KyeypdhnqFnQYSwGPJbmc+V59MDOTXAu/chJ+CrTemG1PJ5UMx+ak6XpNJcaBZmGfSdpnFzJQBEiY1yiyN2AY0CEuZ1IiRAFqAHRjPEHeAh5VCbulfSv2OZYfKV83UI6yTH0+7DlSBVWARWAa+IZZktmJocf1swZAvs3l8fGABWDU0U1Py6bv+g19CcvqDOMZxmT33fW+wObXwYqIvvxz2UFts8R/xHZ4RydgysAJuAAAAAElFTkSuQmCC",
    "extent": [731501.5247058513, 5862982.857784151, 731716.3713230825, 5863099.32407374],
  }]);

  const results2 = await encoder.encodeMVTLayer(mvtLayer, 100, printExtent);
  expect(results2).toStrictEqual([{
    "baseURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAADCAYAAABbNsX4AAAABmJLR0QA/wD/AP+gvaeTAAAAPklEQVQImWNggAKTmac3mcw8vZiBgYGBRW/6RTFWpt9C/xkYPjMwMAQw/P/PyMLK9PslVPGD/4yMIQyMjP8B9GwQsPo+aOwAAAAASUVORK5CYII=",
    "extent": [731501.5247058513, 5862982.857784151, 731716.3713230825, 5863099.32407374],
  }]);
});