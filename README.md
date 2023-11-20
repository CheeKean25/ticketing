# Ticketing App Microservices

# Tech

1. NodeJS
2. React + NextJS

# How to start

1. Start the docker and kubernetes in local

`colima start`

2. Port forward handling. Need check/add the domain name in /etc/hosts

`kubectl port-forward -n <namespace[ingress-nginx]> <nginx-pod-name [ingress-nginx-controller-778d4c6454-8657j]> <desired-port[8080]>:80`

`kubectl port-forward -n ingress-nginx ingress-nginx-controller-778d4c6454-8657j 8080:80`

3. Test whether the port can access

`curl --resolve <ticketing.dev:8080>:127.0.0.1 <http://ticketing.dev:8080/api/users/currentuser>`

`curl --resolve ticketing.dev:8080:127.0.0.1 http://ticketing.dev:8080/api/users/currentuser`

# Features:

1. User can list a ticket for an event (concert, sports) for sale
2. Other users can purchase this ticket
3. Any user can list tickets for sale and purchase tickets
4. When a user attempts to purchase a ticket, the ticket is `locked` for 15 minutes. The user has 15 minutes to enter their payment info.
5. While locked, no other user can purchase the ticket. After 15 minutes, the ticket should `unlock`
6. Ticket prices can be edited if they are not locked

# Database Design

1. User

   - email: string
   - password: string

2. Ticket

   - title:string
   - price:number
   - userId: ref to user (FK) - Person who sell this ticket
   - orderId: ref to order (FK)
   - version: number - Version of this ticket. Increment every time this ticket is changed

3. Order

   - userId: ref to user (FK) - Person who create order
   - status: "Created" | "Cancelled" | "AwaitingPayment" | "Completed"
   - ticketId: ref to ticket (FK)
   - expiresAt: Date - The time at which this order expires (user has 15 mins to pay)

4. Payment
   - stripeId: string
   - orderId: ref to order (FK)

# Services

1. auth

   - Everything related to user signup/signin/signout
   - APIs:
     1. POST /api/users/signup - Sign up for an account
        - Body: {email: string, password:string}
     2. POST /api/users/signin - Sign in to an existing account
        - Body: {email: string, password:string}
     3. POST /api/users/signout - Sign out
        - Body: {}
     4. GET /api/users/currentuser - Return info about the user

2. tickets

   - Ticket creation/editing. Knows whether a ticket can be updated
   - APIs:
     1. GET /api/tickets - Retrieve all tickets
     2. GET /api/tickets/:id - Retrieve ticket with specific ID
     3. POST /api/tickets - Create a ticket
        - Body: {title:string, price:string}
     4. PUT /api/tickets - Update a ticket
        - Body: {title:string, price: string}

3. orders

   - Order creation/editing
   - Listen to two kinds of events: Ticket created/updated, Order created/updated
   - APIs:
     1. GET /api/orders - Retrieve all active orders for the given user making the request
     2. GET /api/orders/:id - Get details about a specific order
     3. POST /api/orders - Create an order to purchase the specified ticket
        - Body: {ticketId:string}
     4. DELETE /api/orders/:id - Cancel the order

4. expiration

   - Watches for orders to be created, cancels them after 15 minutes
   - Orders service needs ot know that an order has gone over the 15 minute time limit. It is up to the orders service to decide whether or not to cancel the order (it might have already been paid!)
   - Example: Order service -> Expiration Service
   - Implemntations
     1. Memory: Timer stored in memory, the service restart, then all timer will gone
     2. NATS: Rely on NATS redelivery mechanism. (Time to emit? No? Then don't ack)
     3. Message Broker (Event bus (not nats)): Broker waits 15 min to publish message. Expiration emit event to event bus and event bus will send the message after the 15mins
     4. Bull JS package - schedule, stored the data/jobs in redis server.
   - Traditional Bull JS Flows:
     1. Request (convert mp4 file into MKV file) -> Web Server (bull js) -(job)> Redis server (list of jobs) -(job)> Worker Server (logic to convert a video file)

5. payments
   - Handles credit card payments. Cancels orders if payments fails, completes if payment succeeds
   - Flows:
     1. Request - Create a charge with some informations (token, orderId...)
     2. Payment Service
        1. Find the order the user is trying to pay for
        2. Make sure the order belongs to this user
        3. Make sure the payment amount matches the amount due for the order
        4. Verify payment with Stripe API
        5. Create 'Charge' record to recrod successful payment
     3. Node Stripe SDK take token/API Key to communicate with Stripe API

# Events

1. User

   - UserCreated
   - UserUpdated

2. Order

   - OrderCreated
     - Need send event to tickets, payments and expiration service
     - Events Involved:
     1. Tickets service needs to be told that one of its tickets has been reserved, and no further edits to that tickets should be allowed
     2. Payments service needs to know there is a new order that a user might submit a payment for
     3. Expiration service needs to start a 15 minute timer to eventually time out this order
   - OrderCancelled
     - Event Involved:
     1. Ticket service should unreserve a ticket if the corresponding order has been cancelled so this ticket can be edited again
     2. Payments should know that any incoming payments for this order should be rejected
   - OrderExpired

3. Ticket

   - TicketCreated
   - TicketUpdated

4. Payments

   - ChargeCreated

5. Expiration

   - Complete

# Steps to Create a Service

1. Create package.json, install deps
2. Write Dockerfile
3. Create index.ts to run project
4. Build image, push to docker hub
5. Write k8s file for deployment, service
6. Update skaffold.yaml to do file sync
7. Write k8s file for Mongodb deployment, service

# Authentication Strategies and Options

## Option 1

- Individual services rely on the auth service
- Flows:
  1. Request (JWT/Cookie/ETC)
  2. Orders Service
  3. Order service send request (Microservices Sync request - direct call) to auth service to decide authentication
- Pros: Can immediately know the status of the user whether or not is banned
- Cons: Auth service goes down = entire app broken

## Option 1.1

- Same as option 1, but different flows
- Flows:
  1. Request (JWT/Cookie/etc)
  2. Auth service (Decide authentication and send request to indended destination)
  3. Target services
- Cons: Same as option 1 as auth service down...

## Option 2

- Teach each individual service how to decide whether or not a user is authenticated?
- Flows:
  1. Request (JWT/Cookie/etc)
  2. Orders service (Has logic to check authentication based on jwt/cookie/etc)
  3. If the cookie/jwt is expired
  4. Request to auth service to refresh token
- Pros: No outside dependency
- Cons: Duplicated the logic on checking authentication, how about if the user is ban but the token is still using for other services?
- Solve the user banned within the validity period
  1. Request to ban a user
  2. Send request to auth service
  3. Update auth mongodb
  4. At the same time, emit a "userbanned" event to event bus
  5. The event bus will send the events to all the services.
  6. The target services should have short-lived in memory cache to record the banned users. The data storing duraiton same as the token validity period as it just need to check the validity in service side when the token is active.

# Cookies vs JWT's

## Cookies

- Transport mechanism
- Moves any kind of data between broswer and server
- Automatically managed by the browser

## JWT's

- Authentication/Authorization mechanism
- Stores any data we want
- Have to manage it manually
- Payload + signing key -> JWT Lib -> JWT

## Requirement of Auth Mechanism

- Must be able to tell us details about a user
- Must be able to handle authorization info
- Must have a built-in, tamper-resistant way to expire or invalidate itself
- Must be easily understood between different languages
  - Cookie handling across languages is usually an issue when we encrypt the data in the cookie
  - We will not encrypt the cookie contents
  - Remember JWT's are tamper resistant
  - You can encrypt the cookie contents if this is a big deal to you
- Must not be require some kind of backing data store on the server

# Testing

## The scope of tests

1. Test a single piece of code in isolation (Unit test )

- Single middleware

2. Test how different pieces of code work together

- Request flowing through multiple middlewares to a request handler

3. Test how different components work together

- Make request to service, ensure write to database was completed

4. Test how different services work together

- Creating a 'payment' at the 'payments' service should affect the 'orders' service

## Dependencies And Todo

1. @types/jest & jest
2. @types/supertest & supertest (Optional)
3. ts-jest (Preset)
4. Package Json:

- Add script:
  - "test":"jest --watchAll --no-cache"
  - --watchAll = when ts file changed, it will detected
  - --no-cache = does not recognize the changes so everytime will run

4. Add property/config in package.json
   ```
   "jest":{
      "preset":"ts-jest", // to handle what typescript is
      "testEnvironment":"node",
      "setupFilesAfterEnv":[
         "./src/test/setup.ts"
      ] // To test jest to run setup file inside of our project after initially start
   }
   ```

## Testing Goal 1: Basic Request Handling

1. npm run test
2. Jest

- start in memory copy of mongodb
- start up our express app
- use supertest library to make fake requests to our express app
- run assertions to make sure the request did the right thing

3. Add --omit=dev in Dockerfile to avoid redownload the dev dependencies everytime

# Code sharing between the services

## Option 1: Direct Copy Paste

- Copy `Auth Service` code into `Tickets Service`
- Cons:
  1. Need to make changes if auth service changed

## Option 2: Git Submodule

- One git repository that consists the common code and supply to several services
- Pros:
  1. Have all common code inside the version control
  2. Solid documentation
- Cons:
  1. Some complicated command whenever create a new git repository

## Option 3: NPM Package

- Put the common code into new project and publish it as a package to the NPM registry
- Install the dependencies in the service projects
- Write typescript, publish javascript --> Easy use for most cases of projects
- Pros:
  1. Support different version. Example, project A use v0.0.1 whereas project B use v0.0.2
- Cons:
  1. Any changes to the code, we need push it up to the NPM registry, then go over different services to update to the latest version
- Three registry type
  1. Public
  2. Private
  3. Organization
- Steps to publish to NPM Registry
  1. Register NPM accont
  2. Open a new project for the code
  3. git commit the project, no need push
  - git init
  - git add .
  - git commit -m "initial commit"
  4. login (npm login)
  5. npm update <pacakge-name> to update the version

# NextJS SSR issue

## How we know it is to use SSR or browser request?

1. Request from a component

- Always issued from browser, so use a domain of "" (No need define the domain)

2. Request from getInitialProps

- Might be executed from the client or the server! Need to figure out what our env is so we can use the correct domain
- Executed on client: Navigating from one page to another while in the app
- Executed on server: Hard refresh the page, clicking link from different domain, typing URL into address bar

## Methods to request

1. Request from browser (No Problem)

- If making request from inside the browser, then can configure Axios to use baseUrl (empty string) which allow browser to figure out the domain, to make the request if running inside the browser. (Browser handle the domain)
- Browser (Request GET ticketing.dev) --> computer local (Request GET 128.0.0.1:80) --> Ingress Nginx --> To Client/Auth Pods

2. Request from Server Side Rendering (Has Problem)

- Will have issue if use `getInitialProps` because the SSR is called inside the cluster/container/client pod which it can't use the `ticketing.dev` domain name to go to the target service

- Two ways to solve:

1. Use service domain name

- Tell axios or something inside the NextJS to put on the domain of the service (Example: http://service.srv/api/users/currentuser). Use the service name.
- Call directly to the service
- But the domain name will be know in client side and need to remember the exact service that handle the request

2. Call ingress nginx

- Use cross namespace because the `default` namespace (the pods/container cluster) can't call the ingress-nginx namespaces for communication
- To reach other namespace and access the ingress nginx x, call the url
  - Url: http//<name-of-service>.<name-of-namespace>.svc.cluster.local
  - Example: http//ingress-nginx.ingress-nginx.svc.cluster.local/api/users/currentuser
- need to take care the cookies
- External name service --> can provide a shorter url for remap the route for easy memorize the long long url of ingress-nginx

# NATS Streaming Server

NATS is one of the Message Queue (Event bus).

NATS and NATS Streaming Server are two different things.

NATS Streaming implements some extraordinarily important design decisions that will affect the app

This code base will run official 'nats-streaming' docker image in kubernetes. Need to read the image's docs

Docs at: docs.nats.io
Commands: https://hub.docker.com/_/nats-streaming

Will use NATS streaming server. There are several message queue systems such as Kafka, RabbitMQ and etc. This code base only to explain the concept of the message queue instead of implementation for produciton.

## Flows

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

## Steps to create

1. Create a new sub-project with typescript support
2. Install `node-nats-streaming` library and connect to nats streaming server
3. Should have two npm scripts, one to run code to emit events, and one to run code to listen for events
4. Program will be ran outside of kubernetes

# Painful Things and Solutions

P: Lots of duplicated code
S: Build a central library as an NPM module to share code between our different projects

P: Hard to picture the flow of events between services
S: Precisely define all of our events in this shared library

P: Hard to remember what properties an event should have
S: Write everythings in Typescript.

P: Hard to test some event flows
S: Write tests for as much as possible/resonable

P: My machine is getting laggy running kubernetes and everything else...
S: Run a k8s cluster in the cloud and develop on it mostly as quickly as local

P: What is someone created a comment after editing a post while balancing on a tight rope
S: Introduce a lot of code to handle concurrency issues

# Add Secret in Kubernetes Environment

1. Command: `kubectl create secret generic <name-of-secret> --from-literal <collection-of-key-value-pair>`
   e.g:

   ```
   kubectl create secret generic stripe-secret --from-
   literal STRIPE_KEY=sk_test_51OEO6sDiEiDlgUPwu0DbcbZqm0xqKZNlNOuZnew1VrJMBxqgxDfWBEKK69QjYkzhyLJzxDRog9yR9U40pe2o9MYw00L95ygzS5
   ```

2. To check secrets list by command: `kubectl get secrets`

3. Open desired to add deployment yaml file and assign the secret under container section.
   e.g:

   ````
   - name: STRIPE_KEY
      valueFrom:
      secretKeyRef:
         name: stripe-secret
         key: STRIPE_KEY```
   ````

4. API Docs: https://stripe.com/docs/api/charges/create?lang=node. Use "tok_visa" to bypass all for testing when does not have token

# Overall Success Flows

Using Postman:

1.  Sign in with your user's credentials.

2.  Create a new ticket.

3.  Create an order for that ticket.

4.  Send payment for that order within 60 seconds of the initial order.

You should see some Skaffold output similar to below:

[tickets] Event published to subject ticket:created

[orders] Message received: ticket:created / orders-service

[orders] Event published to subject order:created

[tickets] Message received: order:created / tickets-service

[expiration] Message received: order:created / expiration-service

[payments] Message received: order:created / payments-service

[expiration] Waiting this many milliseconds to process the job: 59959

[tickets] Event published to subject ticket:updated

[orders] Message received: ticket:updated / orders-service

[orders] Message received: payment:created / orders-service

[payments] Event published to subject payment:created

[expiration] Event published to subject expiration:complete

[orders] Message received: expiration:complete / orders-service

# CI/CD

Local Machine

1. Macke changes to code for ticket service
2. Commit code to git branch
3. Push branch to github

GitHub

1. GitHub receives updated branch
2. You manually create a pull request to merge branch into master
3. GitHub automatically runs tests for project
4. After tests pass, you merge PR into master branch
5. Because master branch has changed, github builds and deploys
