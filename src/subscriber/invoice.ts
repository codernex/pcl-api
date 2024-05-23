import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
} from "typeorm";
import { Invoice } from "../entities";
@EventSubscriber()
export class InvoiceSubscriber implements EntitySubscriberInterface<Invoice> {
  listenTo() {
    return Invoice;
  }
  async beforeInsert(event: InsertEvent<Invoice>) {
    const entity = event.entity;
    const manager = event.manager;

    const count = await manager.count(Invoice);

    entity.invoice_id = `#INV-${(count + 1).toString().padStart(6, "0")}`;
  }
}
