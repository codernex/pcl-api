import {
  EventSubscriber,
  EntitySubscriberInterface,
  RemoveEvent,
} from "typeorm";
import { Brand, Category } from "../entities";

@EventSubscriber()
export class CategorySubscriber implements EntitySubscriberInterface<Category> {
  listenTo(): string | Function {
    return Category;
  }
  async beforeRemove(event: RemoveEvent<Category>) {
    const entity = event.entity;
    const manager = event.manager;

    const count = await manager.count(Brand, {
      where: {
        categories: {
          id: entity?.id,
        },
      },
    });

    if(count){
        throw new Error('Category is in use');
    }
  }
}
