# Ticketing Client

# Steps to create project

1. Create a new folder
2. Go in the root of folder and execute the command `npm init -y`
3. Install dependencies with yarn/npm

- react
- react-dom
- next

# NextJS

- The route is based on the folder&files name according to the `pages` folder
- file name = route name
- folder name = module name
- `index.js` is the main file to load in `pages` folder

# Authentication

1. Request to website
2. Inspect URL of incoming request. Determine set of components to show
3. Call those component's 'getInitialProps' static method
4. Render each component with data from 'getInitialProps' one time
5. Assemble HTML from all components, send back response

# Route

1. Show sign in form
   - `/auth/signin`
2. Show sign up form
   - `/auth/signup`
3. Sign out
   - `/auth/signout`
4. Show list of all tickets
   - `/`
5. Form to create a new ticket
   - `/tickets/new`
6. Details about a specific ticket
   - `/tickets/:ticketId`
7. Show info about an order + payment button
   - `/orders/:orderid`
