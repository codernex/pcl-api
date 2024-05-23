import {
    EntitySubscriberInterface,
    EventSubscriber,
    InsertEvent
} from "typeorm";
import { Purchase } from "../entities";

@EventSubscriber()
export class PurchaseSubscriber implements EntitySubscriberInterface<Purchase> {
  listenTo(): string | Function {
    return Purchase;
  }

  async beforeInsert(event: InsertEvent<Purchase>) {
    const entity = event.entity;

    console.log("Before Save", entity);
  }
}
