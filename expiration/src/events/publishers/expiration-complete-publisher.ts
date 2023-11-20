import {
  ExpirationCompleteEvent,
  Publisher,
  Subjects,
} from "@kentickets/kencommon";

export class ExpirationCompletePublisher extends Publisher<ExpirationCompleteEvent> {
  subject: Subjects.ExpirationComplete = Subjects.ExpirationComplete;
}
