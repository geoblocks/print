import {css} from 'lit';

export const olCss = css`
  .ol-control {
    position: absolute;
    background-color: rgba(255, 255, 255, 0.4);
    border-radius: 4px;
    padding: 2px;
  }
  .ol-control:hover {
    background-color: rgba(255, 255, 255, 0.6);
  }
  .ol-zoom {
    top: 0.5em;
    left: 0.5em;
  }
  .ol-control button {
    display: block;
    margin: 1px;
    padding: 0;
    color: white;
    font-size: 1.14em;
    font-weight: bold;
    text-decoration: none;
    text-align: center;
    height: 1.375em;
    width: 1.375em;
    line-height: 0.4em;
    background-color: rgba(0, 60, 136, 0.5);
    border: none;
    border-radius: 2px;
  }
  .ol-control button::-moz-focus-inner {
    border: none;
    padding: 0;
  }
  .ol-rotate {
    top: 0.5em;
    right: 0.5em;
    transition: opacity 0.25s linear, visibility 0s linear;
  }
  .ol-rotate.ol-hidden {
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.25s linear, visibility 0s linear 0.25s;
  }
  .ol-attribution li {
    display: inline;
    list-style: none;
  }
  .ol-attribution li:not(:last-child):after {
    content: ' ';
  }
  .ol-attribution img {
    max-height: 2em;
    max-width: inherit;
    vertical-align: middle;
  }
  .ol-attribution button {
    flex-shrink: 0;
  }
  .ol-attribution.ol-collapsed ul {
    display: none;
  }
  .ol-attribution:not(.ol-collapsed) {
    background: rgba(255, 255, 255, 0.8);
  }
  .ol-attribution.ol-uncollapsible {
    bottom: 0;
    right: 0;
    border-radius: 4px 0 0;
  }
  .ol-attribution.ol-uncollapsible img {
    margin-top: -0.2em;
    max-height: 1.6em;
  }
  .ol-attribution.ol-uncollapsible button {
    display: none;
  }
  .ol-viewport,
  .ol-unselectable {
    user-select: none;
  }
  .ol-selectable {
    user-select: text;
  }
`;
