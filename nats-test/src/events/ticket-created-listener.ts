import { Listener, Subjects, TicketCreatedEvent } from "@kentickets/kencommon";
import { Message } from "node-nats-streaming";

export class TicketCreatedListener extends Listener<TicketCreatedEvent> {
  // Why declared datatype?
  // To let TS know the type is subjects.ticektcreated and
  // won't change in future in other place
  // OR
  // put readonly keyword to avoid changes
  readonly subject = Subjects.TicketCreated;
  queueGroupName = "payments-service";
  onMessage(data: TicketCreatedEvent["data"], msg: Message): void {
    console.log("Event data!", data);
    msg.ack();
  }
}
