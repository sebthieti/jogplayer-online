import MediumModel from '../models/medium.model';

export default class MediumViewModel extends MediumModel {
  selected: boolean;

  constructor(medium: MediumModel) {
    super(medium.origin, medium);
  }
}
