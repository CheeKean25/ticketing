import {
  PaymentCreatedEvent,
  Publisher,
  Subjects,
} from "@kentickets/kencommon";

export class PaymentCreatedPublisher extends Publisher<PaymentCreatedEvent> {
  readonly subject = Subjects.PaymentCreated;
}
