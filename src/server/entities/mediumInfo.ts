export interface IFFMpegMediumDetail {
  streams: IFFMpegMediumStreamInfo[];
  format: IFFMpegMediumFormat;
  chapters: IFFMpegMediumChapter[];
}

export interface IFFMpegMediumStreamInfo {
  index: number;
  codec_name: string;
  codec_long_name: string;
  profile: string;
  codec_type: string;
  codec_time_base: string;
  codec_tag_string: string;
  codec_tag: string;
  sample_fmt: string;
  sample_rate: number;
  channels: number;
  channel_layout: string;
  bits_per_sample: number;
  id: string;
  r_frame_rate: string;
  avg_frame_rate: string;
  time_base: string;
  start_pts: number;
  start_time: number;
  duration_ts: number;
  duration: number;
  bit_rate: number;
  nb_frames: string;
  nb_read_frames: string;
  nb_read_packets: string;
  disposition: IFFMpegMediumStreamDisposition;
}

export interface IFFMpegMediumStreamDisposition {
  default: number;
  dub: number;
  original: number;
  comment: number;
  lyrics: number;
  karaoke: number;
  forced: number;
  hearing_impaired: number;
  visual_impaired: number;
  clean_effects: number;
  attached_pic: number;
}

export interface IFFMpegMediumFormat {
  filename: string;
  nb_streams: 1;
  nb_programs: 0;
  format_name: string;
  format_long_name: string;
  start_time: 0.011995;
  duration: 188.447347;
  size: 7539222;
  bit_rate: 320056;
  probe_score: 51;
  tags: IFFMpegMediumTags;
}

export interface IFFMpegMediumTags {
  date: 2004;
  track: 1;
  artist: string;
  composer: string;
  Engineer: string;
  title: string;
  publisher: string;
  genre: string;
  album: string;
  album_artist: string;
  encoder: string;
}

export interface IFFMpegMediumChapter {
}

export interface IMediumInfo {
  name: string;
  fileext: string;
  detailedInfo: IFFMpegMediumDetail;
}

export default class MediumInfo implements IMediumInfo {
  name: string;
  fileext: string;
  detailedInfo: IFFMpegMediumDetail;

  constructor(entity: IMediumInfo) {
    this.name = entity.name;
    this.fileext = entity.fileext;
    this.detailedInfo = entity.detailedInfo;
  }
}
