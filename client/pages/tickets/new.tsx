import { FormEvent, useState } from "react";
import useRequest from "../../hooks/useRequest";
import Router from "next/router";

const NewTickets = () => {
  const [title, setTitle] = useState<string>("");
  const [price, setPrice] = useState<string>("");

  const { doRequest, errors } = useRequest({
    url: "/api/tickets",
    method: "post",
    body: {
      title,
      price,
    },
    onSuccess: (ticket) => Router.push("/"),
  });

  const onBlur = () => {
    const value = parseFloat(price);
    if (isNaN(value)) {
      return;
    }
    setPrice(value.toFixed(2));
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();

    doRequest();
  };

  return (
    <div>
      <h1>Create a new ticket</h1>
      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label>Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label>Price</label>
          <input
            onBlur={onBlur}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="form-control"
          />
        </div>
        {errors}
        <button className="mt-1 btn btn-primary">Submit</button>
      </form>
    </div>
  );
};

export default NewTickets;
