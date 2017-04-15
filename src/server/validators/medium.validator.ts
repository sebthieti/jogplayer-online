export default class MediumValidator {
  static assertAndGetPlaylistIndexAndMediumId(rawParams: any): { playlistIndex: number, mediumId: string } {
    if (!rawParams.playlistIndex || !rawParams.mediumId) {
      throw new Error('playlistId or mediumId have not been provided.');
    }
    return {playlistIndex: +rawParams.playlistIndex, mediumId: rawParams.mediumId};
  }
}
