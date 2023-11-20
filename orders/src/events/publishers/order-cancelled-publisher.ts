import {
  OrderCancelledEvent,
  Publisher,
  Subjects,
} from "@kentickets/kencommon";

export class OrderCancelledPublisher extends Publisher<OrderCancelledEvent> {
  readonly subject = Subjects.OrderCancelled;
}
