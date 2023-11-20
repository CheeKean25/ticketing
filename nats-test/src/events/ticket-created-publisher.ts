import { Publisher, Subjects, TicketCreatedEvent } from "@kentickets/kencommon";

export class TicketCreatedPublisher extends Publisher<TicketCreatedEvent> {
  readonly subject = Subjects.TicketCreated;
}
