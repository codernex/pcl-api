import {
    EntitySubscriberInterface,
    EventSubscriber,
    RemoveEvent,
} from "typeorm";
import { Brand, Model } from "../entities";

@EventSubscriber()
export class BrandSubscriber implements EntitySubscriberInterface<Brand> {
  listenTo(): string | Function {
    return Brand;
  }
  async beforeRemove(event: RemoveEvent<Brand>) {
    const entity = event.entity;
    const manager = event.manager;

    const count = await manager.count(Model, {
      where: {
        brands: {
          id: entity?.id,
        },
      },
    });

    if (count) {
      throw new Error("Brand is in use");
    }
  }
}
