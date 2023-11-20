import Link from "next/link";
import { Tickets } from "../models/tickets";

interface LandingPageProps {
  tickets: Tickets[];
}

const LandingPage = ({ tickets }: LandingPageProps) => {
  const ticketList = tickets.map((ticket) => {
    return (
      <tr key={ticket.id}>
        <td>{ticket.title}</td>
        <td>{ticket.price}</td>
        <td>
          <Link
            href="/tickets/[ticketId]"
            className="nav-link"
            as={`/tickets/${ticket.id}`}
          >
            View
          </Link>
        </td>
      </tr>
    );
  });

  return (
    <div>
      <h1>Tickets</h1>
      <table className="table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Price</th>
            <th>Link</th>
          </tr>
        </thead>
        <tbody>{ticketList}</tbody>
      </table>
    </div>
  );
};

// SSR
// If call the same api in _app, this api will be stop and does not called
LandingPage.getInitialProps = async (context, client, currentUser) => {
  const { data } = await client.get("/api/tickets");

  return { tickets: data };
};

export default LandingPage;
