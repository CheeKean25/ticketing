import { useEffect, useState } from "react";
import { Orders } from "../../models/orders";
import StripeCheckout from "react-stripe-checkout";
import useRequest from "../../hooks/useRequest";
import Router from "next/router";

interface OrderShowProps {
  currentUser: any;
  order: Orders;
}

const OrderShow = ({ order, currentUser }: OrderShowProps) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  const { doRequest, errors } = useRequest({
    url: "/api/payments",
    method: "post",
    body: {
      orderId: order.id,
    },
    onSuccess: (payment) => Router.push("/orders"),
  });

  useEffect(() => {
    const findTimeLeft = () => {
      const msLeft = new Date(order.expiresAt).getTime() - new Date().getTime();
      setTimeLeft(Math.round(msLeft / 1000));
    };
    findTimeLeft();
    const timerId = setInterval(findTimeLeft, 1000);

    return () => {
      clearInterval(timerId);
    };
  }, [order]);

  if (timeLeft < 0) {
    return <div>Order expired</div>;
  }

  return (
    <div>
      Time left to pay: {timeLeft} seconds
      <StripeCheckout
        token={(token) => doRequest({ token: token.id })}
        stripeKey="pk_test_51OEO6sDiEiDlgUPwABCh4vwR0c4vsopckuBin9GzhYhBXgSW9zqgd07d2pcyTsz4dlDJjPdNlOvxW6FcBmeLp4zx000fj5P1uf" // Can put to secret environment variable
        amount={order.ticket.price * 100}
        email={currentUser.email}
      />
      {errors}
    </div>
  );
};

OrderShow.getInitialProps = async (context, client) => {
  const { orderId } = context.query;
  const { data } = await client.get(`/api/orders/${orderId}`);

  return { order: data, currentUser: client };
};

export default OrderShow;
