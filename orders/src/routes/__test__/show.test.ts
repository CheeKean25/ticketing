import mongoose from "mongoose";
import { app } from "../../app";
import { Ticket } from "../../models/ticket";
import request from "supertest";

it("fetches the order", async () => {
  // Create a ticket
  const ticket = Ticket.build({
    title: "concert",
    price: 20,
    id: new mongoose.Types.ObjectId().toHexString(),
  });
  await ticket.save();

  // Create a user
  const user = global.signin();

  // Make a request to build an order with this ticket
  const { body: order } = await request(app)
    .post("/api/orders")
    .set("Cookie", user)
    .send({ ticketId: ticket.id })
    .expect(201);

  // Make request to fetch order
  ``;
  const { body: fetchedOrder } = await request(app)
    .get(`/api/orders/${order.id}`)
    .set("Cookie", user)
    .send()
    .expect(200);

  expect(fetchedOrder.id).toEqual(order.id);
});

it("return an error if one user tried to fetch another users order", async () => {
  // Create a ticket
  const ticket = Ticket.build({
    title: "concert",
    price: 20,
    id: new mongoose.Types.ObjectId().toHexString(),
  });
  await ticket.save();

  // Create a user
  const user = global.signin();

  // Make a request to build an order with this ticket
  const { body: order } = await request(app)
    .post("/api/orders")
    .set("Cookie", user)
    .send({ ticketId: ticket.id })
    .expect(201);

  // Make request to fetch order

  await request(app)
    .get(`/api/orders/${order.id}`)
    .set("Cookie", global.signin())
    .send()
    .expect(401);
});

// unit test if the user unauthorized
it("returns a 401 if the user is not authenticated", async () => {
  const id = "123";

  await request(app).get(`/api/orders/${id}`).send().expect(401);
});

// unit test if the order id invalid, given it is authorized
it("returns a 400 if the order id is invalid", async () => {
  const id = "123";

  await request(app)
    .get(`/api/orders/${id}`)
    .set("Cookie", global.signin())
    .send()
    .expect(400);
});

// unit test if the order  does not exist, given it is authorized and valid order id
it("returns a 404 if the order does not exist", async () => {
  const id = new mongoose.Types.ObjectId().toHexString();

  await request(app)
    .get(`/api/orders/${id}`)
    .set("Cookie", global.signin())
    .send()
    .expect(404);
});
