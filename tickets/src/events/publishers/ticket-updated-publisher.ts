import { Publisher, Subjects, TicketUpdatedEvent } from "@kentickets/kencommon";

export class TicketUpdatedPublisher extends Publisher<TicketUpdatedEvent> {
  subject: Subjects.TicketUpdated = Subjects.TicketUpdated;
}
