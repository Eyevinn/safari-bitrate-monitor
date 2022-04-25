import { SafariBitrateMonitor } from "../index.ts";

document.addEventListener("DOMContentLoaded", () => {
  const videoElement = document.querySelector("video");
  const handler = (quality) => {
    console.log(`bitrate changed –>`, quality);
  };
  const src =
    "https://f53accc45b7aded64ed8085068f31881.egress.mediapackage-vod.eu-north-1.amazonaws.com/out/v1/1c63bf88e2664639a6c293b4d055e6bb/ade303f83e8444d69b7658f988abb054/2a647c0cf9b7409598770b9f11799178/manifest.m3u8";
  new SafariBitrateMonitor({
    videoElement,
    hlsManifestUrl: src,
    handler,
  });
});
