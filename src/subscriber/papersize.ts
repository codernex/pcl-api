import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
  Equal,
  Not,
} from "typeorm";
import { InvoicePaper } from "../entities";

@EventSubscriber()
export class PaperSizeSubsciber
  implements EntitySubscriberInterface<InvoicePaper>
{
  async beforeUpdate(event: UpdateEvent<InvoicePaper>) {
    const entity = event.entity;
    const manager = event.manager;

    if (entity?.default) {
      // Set all other InvoicePaper entries to default = false
      await manager.update(
        InvoicePaper,
        { default: true, id: Not(entity.id) },
        { default: false }
      );
    }
  }

  async beforeInsert(event: InsertEvent<InvoicePaper>) {
    const entity = event.entity;
    const manager = event.manager;

    if (entity?.default) {
      // Set all other InvoicePaper entries to default = false
      await manager.update(
        InvoicePaper,
        { default: true, id: Not(entity.id) },
        { default: false }
      );
    }
  }
}
