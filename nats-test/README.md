# NATS Streaming Server

NATS is one of the Message Queue (Event bus).

NATS and NATS Streaming Server are two different things.

NATS Streaming implements some extraordinarily important design decisions that will affect the app

This code base will run official 'nats-streaming' docker image in kubernetes. Need to read the image's docs

Docs at: docs.nats.io
Commands: https://hub.docker.com/_/nats-streaming

Will use NATS streaming server. There are several message queue systems such as Kafka, RabbitMQ and etc. This code base only to explain the concept of the message queue instead of implementation for produciton.

# Terms in depl

1. `p` = port
2. `m` = monitoring port
3. `hbi` = how often the server to make heartbeat request to each of its client
4. `hbt` = how long each client has to respond
5. `hbf` = the no of times that each client can fail before that streaming server is going to assugm that the connection is dead and gone

# Flows

1. With Custom Event Bus

   - Ticket service send event to custom event bus through `axios`
   - Event bus received event in express.js and send to orders service through `axios`
   - Order service received the event
   - Send one events to multiple services
   - Data will store in event bus service which is good to handle downtime (To make sure the events are executed)

2. With NATS Streaming
   - Will use client library called `node-nats-streaming`
   - Ticket service send event to custom event bus through `node-nats-streaming`
   - Event bus received event in express.js and send to orders service through axios
   - Order service received the event
   - NATS streaming requires to subscribe to channels. Events are emitted to specific channels
   - Ticket service `publish` to `A` channel and target services will `subscribed` to `A` channel as well
   - If new service/service go downtime, it will up-to-date/ask with the NATS Streaming events after subscribed
   - The events will stored in memory by default, flat files or in a MySQL/Postgres DB

# Steps to create

1. Create a new sub-project with typescript support
2. Install `node-nats-streaming` library and connect to nats streaming server
3. Should have two npm scripts, one to run code to emit events, and one to run code to listen for events
4. Program will be ran outside of kubernetes
5. Can use `kubectl port-forward <pod-name> <local-to-access-port-mo>:<port-on-pod-to-access>` to temporary access to the NATS from outside of kubernetes

# Publisher

- Consist data and subject (name of channel [e.g: ticket:created])
- stan client publish data&subject to NATS Streaming
- data need in string type

# Listener

- Consist of subject and pass into the stan client to tell the NATS server that anytime some information is published from this channel, we want to receive the copy of that information (subscription)
- data need in string type
- When received the event from NATS server, it will ack and tell server that it was received. It will caused error when process the logic inside the listener so need to add options

# Channel

- Located in NATS server and we are listen to

# Client

- Every client has a id for connect

# Queue Groups

- Multiple queue group assign to one channel
- To make sure multiple instance of service (Started two same service) does not to receive the exact same event.
- Queue Groups > has one `myQueueGroup` > services subscript to the `myQueueGroup` > `myQueueGroup` will assign multiple/duplicate query to same instance service evenly
- Limit the time of event send out

# Client Health Check

1. Use another port (8222) for monitoring.
2. Remember use port-forward
3. Access localhost:8222
4. Access to `http://localhost:8222/streaming/channelsz?subs=1` to check the subscription

# Concurrency Issues

- Event might be failed which will execute the other event.
- Sometime it will caused error.
- For example, three events: deposit 40, deposit 70, withdraw 110
- Event deposit 40 is executed, deposit 70 was failed, withdraw 100 will cause error here
- Situations:
  1.  NATS might think a client is still alive when it is dead
  2.  One listener might run more quickly than another
  3.  Listener can fail to process the event
  4.  The transaction service will be failed and can't send event to event bus
      - Create a `events_collections` in transaction database, save the event and status (sent or no sent)
      - If success sent the event to event bus, then update the status to become `sent`, vice versa.
      - Implement database transaction and rollback

## Solution

1. The event need pass through a transaction service and database before send to event bus.
2. In transaction service, add the event into the database and assign a sequence number/txn number for particular users/items.
3. Send the event to event bus.
4. Event bus will send the event and data to all the listeners
5. Listener will check the sequence number in target's service database. Example, if last txn id is null, then the service only accept the data with sequence number = 1. Even though the event is failed, or other event is quickly than first event, it will not handle/proceed as it only can support the event with sequence number = 1

**Example:**

1. Network Request to Create/Update/Delete Resource XYZ
2. Service that owns XYZ <-> Database Storing XYZ
3. Event Describing Change to XYZ
4. NATS
5. Event -> Service that needs to update its data based upon the Event

**Scenario:**

Ticket service -> Update ticket price
Order service -> Need to get ticket price if updated or retrieving

Given Order service has two `listener (A & B)`

1. Browser send request to create/update a ticket
2. To solve the issues on concurrency during create & update ticket price
3. Send the requests 1 to tickets service:
   1. Type: Create ticket, price = 10
   2. Add version = 1 for it and store in tickets database
   3. Add event and send to NATS
4. Send the request 2 to tickets service simultaneously:
   1. Type: Update ticket, price = 50
   2. Update the existing database data and increment the version = 2
   3. Add event and send to NATS
5. Send the request 3 to tickets service in sequence:

   1. Type: Update ticket, price = 100
   2. Update the existing database data and increment the version = 3
   3. Add event and send to NATS

6. Event 1 go to listner A and event 2 go to listener B:

   If event 1 failed, need to wait 30 seconds to be processed. So it will be throw back to NATS and wait 30 seconds again before send to the service.

   At the same time, event 2 has go to listner B, but it can't be execute because event 1 failed. So, after 30 seconds, it throw back to NATS again and wait another 30 seconds.

   Then event 1 has go to the service again and it success execute, and we acknowledge it.

   Now, can process to event 2 and 3 now.

## Event Redelivery

To handle the services that missed the events. For example, services down or error.
Add `setDeliverAllAvailable` options in listener's subscription. It will returns all the event history. One of the cons is it will return all the event history that included processed and not processed. To make sure at the very first time, the event hisotry will be pass to the service.

Add `setDurableName(<name>)` options in listener's subscription. The channel will create a record listing all the different verbal subscriptions that have. It will mark the processed events as completed/processed. It can help to get the event history that's haven't processed.
