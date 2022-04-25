export interface IQualityLevel {
  bitrate: number;
  width: number;
  height: number;
}

export interface IHLSPlaylist {
  url: string;
  width: number;
  height: number;
  bitrate: number;
}

const HLS_ATTRIBUTE_REGEXP = new RegExp(
  '(?:,?)([A-Z0-9-]+?)[=](".*?"|[^",]+)(?=,|s*$)',
  "g"
);

const BITRATE_POLL_INTERVAL = 5 * 1000;

export class SafariBitrateMonitor {
  private videoElement: HTMLVideoElement;
  private handler: (qualityLevel: IQualityLevel) => void;

  private currentBitrate: number;
  private playlists: IHLSPlaylist[] = [];
  private bitrateInterval: number;

  constructor({
    videoElement,
    hlsManifestUrl,
    handler,
  }: {
    videoElement: HTMLVideoElement;
    hlsManifestUrl: string;
    handler: (qualityLevel: IQualityLevel) => void;
  }) {
    if (!videoElement || !hlsManifestUrl) {
      console.error("[SafariBitrateMonitor] Missing video element or manifest url");
      return;
    }
    this.videoElement = videoElement;
    this.handler = handler;
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
          }
        }
        if (valid) {
          playlists.push(playlist);
        }
      }
    });
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
        });
      }
    }, BITRATE_POLL_INTERVAL);
  }

  public destroy() {
    clearInterval(this.bitrateInterval);
    this.playlists = [];
  }
}
