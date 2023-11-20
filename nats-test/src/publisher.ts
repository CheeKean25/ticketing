import nats from "node-nats-streaming";
import { TicketCreatedPublisher } from "./events/ticket-created-publisher";

console.clear();

// Client = stan
const stan = nats.connect("ticketing", "abc", {
  url: "http://localhost:4222",
});

// After stan/client success connect to NATS server
stan.on("connect", async () => {
  console.log("Publisher connected to NATS");

  try {
    const publisher = new TicketCreatedPublisher(stan);
    await publisher.publish({
      id: "123",
      title: "concert",
      price: 20,
      userId: "asdf",
    });
  } catch (error) {
    console.log(error);
  }
});
