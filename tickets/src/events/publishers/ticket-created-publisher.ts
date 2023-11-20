import { Publisher, Subjects, TicketCreatedEvent } from "@kentickets/kencommon";

// TicketCreatedPublisher Class
export class TicketCreatedPublisher extends Publisher<TicketCreatedEvent> {
  readonly subject = Subjects.TicketCreated;
}
