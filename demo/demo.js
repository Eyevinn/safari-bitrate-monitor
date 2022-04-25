import { SafariBitrateMonitor } from "../index.ts";

document.addEventListener("DOMContentLoaded", () => {
  const videoElement = document.querySelector("video");
  const handler = (quality) => {
    console.log(`bitrate changed –>`, quality);
  };
  const src = "https://lbs-usp-hls-vod.cmore.se/vod/36af2/mdbyobowjbn(13730007_ISMUSP).ism/mdbyobowjbn(13730007_ISMUSP).m3u8?hls_no_audio_only=true";
  new SafariBitrateMonitor({
    videoElement,
    hlsManifestUrl: src,
    handler
  });
});
