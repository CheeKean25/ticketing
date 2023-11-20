import { OrderCreatedEvent, Publisher, Subjects } from "@kentickets/kencommon";

export class OrderCreatedPublisher extends Publisher<OrderCreatedEvent> {
  readonly subject = Subjects.OrderCreated;
}
