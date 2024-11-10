import {
  EntitySubscriberInterface,
  EventSubscriber,
  UpdateEvent,
} from "typeorm";
import { Track } from "../entities/track";

@EventSubscriber()
export class TrackSubscriber implements EntitySubscriberInterface<Track> {
  listenTo(): Function | string {
    return Track;
  }
  async beforeUpdate(event: UpdateEvent<Track>) {
    const track = event.entity as Track;

    if (track.savingWeight && track.netWeight && track.customsCost) {
      track.savingCost =
        (Number(track.customsCost) / parseInt(track.netWeight)) *
        (parseInt(track.savingWeight) / 2);
    }
  }
}
