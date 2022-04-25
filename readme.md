Safari Bitrate Monitor
===

A small package to monitor buffering and dropped frames on the video element, reporting it back as state updates into a sent in callback.

## Simple Usage

```js
  import { SafariBitrateMonitor } from "@eyevinn/safari-bitrate-monitor";

  const videoElement = document.querySelector("video");
  
  function handler = (qualityLevel) => {
    console.log(`bitrate changed –>`, qualityLevel);
  };

  const safariBitrateMonitor = new SafariBitrateMonitor(handler);
  const src = ""; //HLS Manifest url
  safariBitrateMonitor.load(videoElement, src);
```

## Quality Object

```ts
export interface IQualityLevel {
  bitrate: number;
  width: number;
  height: number;
}
```

## About Eyevinn Technology

Eyevinn Technology is an independent consultant firm specialized in video and streaming. Independent in the sense that we are not commercially tied to any platform or technology vendor.

At Eyevinn, every software developer consultant has a dedicated budget reserved for open source development and contribution to the open source community. This gives us room for innovation, team building and personal competence development. And also gives us as a company a way to contribute back to the open source community.

Want to know more about Eyevinn and how it is to work here. Contact us at work@eyevinn.se!
