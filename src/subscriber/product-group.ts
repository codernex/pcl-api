import {
  EntitySubscriberInterface,
  EventSubscriber,
  RemoveEvent,
} from "typeorm";
import { Category, ProductGroup } from "../entities";

@EventSubscriber()
export class ProductGroupSubscriber
  implements EntitySubscriberInterface<ProductGroup>
{
  listenTo(): string | Function {
    return ProductGroup;
  }
  async beforeRemove(event: RemoveEvent<ProductGroup>) {
    const productGroup = event.entity;

    const manager = event.manager;

    const count = await manager.count(Category, {
      where: {
        productGroup: productGroup?.name,
      },
    });

    if (count) {
      throw new Error(
        "Product Group cannot be deleted because it has associated categories"
      );
    }
  }
}
