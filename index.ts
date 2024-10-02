export interface IQualityLevel {
  bitrate: number;
  width: number;
  height: number;
  fps: number;
  audioCodec: string;
  videoCodec: string;
}

export interface IHLSPlaylist extends IQualityLevel {
  url: string;
}

const HLS_ATTRIBUTE_REGEXP = new RegExp(
  '(?:,?)([A-Z0-9-]+?)[=](".*?"|[^",]+)(?=,|s*$)',
  "g"
);

const guessCodec = (
  codecs: string[]
): { audio?: string; video: string } | undefined => {
  if (codecs.length === 1) {
    return {
      audio: undefined,
      video: codecs[0],
    };
  }

  if (codecs.length >= 2) {
    // Guess based on some of the most common codecs. There is no
    // way to be 100% certain which codec belongs to which track
    // in the HLS standard.
    const firstIsProbablyVideo = codecs[0].includes("avc");
    const secondIsProbablyVideo = codecs[1].includes("avc");

    const firstIsProbablyAudio = codecs[0].includes("mp4a");
    const secondIsProbablyAudio = codecs[1].includes("mp4a");

    if (firstIsProbablyVideo) {
      return {
        video: codecs[0],
        audio: codecs[1],
      };
    }

    if (secondIsProbablyVideo) {
      return {
        video: codecs[1],
        audio: codecs[0],
      };
    }

    if (firstIsProbablyAudio) {
      return {
        video: codecs[1],
        audio: codecs[0],
      };
    }

    if (secondIsProbablyAudio) {
      return {
        video: codecs[0],
        audio: codecs[1],
      };
    }
  }
};

const BITRATE_POLL_INTERVAL = 5 * 1000;

export class SafariBitrateMonitor {
  private bitratePollInterval: number = BITRATE_POLL_INTERVAL;

  private videoElement: HTMLVideoElement;
  private handler: (qualityLevel: IQualityLevel) => void;

  private currentBitrate: number;
  private playlists: IHLSPlaylist[] = [];
  private bitrateInterval: number;

  constructor({
    videoElement,
    hlsManifestUrl,
    handler,
    bitratePollInterval,
  }: {
    videoElement: HTMLVideoElement;
    hlsManifestUrl: string;
    handler: (qualityLevel: IQualityLevel) => void;
    bitratePollInterval?: number;
  }) {
    if (!videoElement || !hlsManifestUrl) {
      console.error(
        "[SafariBitrateMonitor] Missing video element or manifest url"
      );
      return;
    }
    this.videoElement = videoElement;
    this.handler = handler;
    if (bitratePollInterval) {
      this.bitratePollInterval = bitratePollInterval;
    }
    this.init(hlsManifestUrl);
  }

  private async init(hlsManifestUrl: string): Promise<void> {
    this.playlists = await this.getPlaylists(hlsManifestUrl);
    if (this.playlists.length) {
      this.startBitratePoll();
    }
  }

  private async getPlaylists(src: string): Promise<IHLSPlaylist[]> {
    const response = await fetch(src);
    if (!response.ok) {
      return [];
    }
    const manifestString = await response.text();
    const manifestLines = manifestString.split("\n");
    const playlists: IHLSPlaylist[] = [];

    manifestLines.forEach((line, index) => {
      const playlist: IHLSPlaylist = {
        url: null,
        width: 0,
        height: 0,
        bitrate: 0,
        fps: 0,
        audioCodec: "",
        videoCodec: "",
      };
      if (line.includes("#EXT-X-STREAM-INF")) {
        let valid = false;
        playlist.url = manifestLines[index + 1];
        let group: string[];
        while ((group = HLS_ATTRIBUTE_REGEXP.exec(line)) !== null) {
          const [, attribute, value] = group;
          switch (attribute) {
            case "BANDWIDTH":
              valid = true;
              playlist.bitrate = Number(value);
              break;
            case "RESOLUTION": {
              const [width, height] = value.split("x");
              playlist.width = Number(width);
              playlist.height = Number(height);
              break;
            }
            case "CODECS": {
              const codecs = value.replace(/"/g, "").split(",");

              const avCodecs = guessCodec(codecs);

              playlist.videoCodec = avCodecs.video;
              playlist.audioCodec = avCodecs.audio;

              break;
            }
            case "FRAME-RATE":
              if (value) {
                playlist.fps = Number(value);
              }
              break;
            default:
              break;
          }
        }
        if (valid) {
          playlists.push(playlist);
        }
      }
    });
    console.log("play", playlists);
    return playlists;
  }

  private startBitratePoll() {
    this.bitrateInterval = window.setInterval(() => {
      const width = this.videoElement.videoWidth;
      const height = this.videoElement.videoHeight;

      const playlist = this.playlists.find(
        (playlist) => playlist.width === width && playlist.height === height
      );
      if (playlist && playlist.bitrate !== this.currentBitrate) {
        this.currentBitrate = playlist.bitrate;

        this.handler({
          bitrate: playlist.bitrate,
          width: playlist.width,
          height: playlist.height,
          videoCodec: playlist.videoCodec,
          audioCodec: playlist.audioCodec,
          fps: playlist.fps,
        });
      }
    }, this.bitratePollInterval);
  }

  public destroy() {
    clearInterval(this.bitrateInterval);
    this.playlists = [];
  }
}
