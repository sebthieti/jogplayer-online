export interface FFMpegMediumDetail {
  streams: FFMpegMediumStreamInfo[];
  format: FFMpegMediumFormat;
  chapters: FFMpegMediumChapter[];
}

export interface FFMpegMediumStreamInfo {
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
  disposition: FFMpegMediumStreamDisposition;
}

export interface FFMpegMediumStreamDisposition {
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

export interface FFMpegMediumFormat {
  filename: string;
  nb_streams: number;
  nb_programs: number;
  format_name: string;
  format_long_name: string;
  start_time: number;
  duration: number;
  size: number;
  bit_rate: number;
  probe_score: number;
  tags: FFMpegMediumTags;
}

export interface FFMpegMediumTags {
  date: number;
  track: number;
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

export interface FFMpegMediumChapter {
}

export interface MediumInfo {
  name: string;
  fileext: string;
  detailedInfo: FFMpegMediumDetail;
}
