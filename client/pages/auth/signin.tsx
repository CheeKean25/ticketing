import { FormEvent, useState } from "react";
import useRequest from "../../hooks/useRequest";
import Router from "next/router";

const Signin = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const { doRequest, errors } = useRequest({
    body: {
      email,
      password,
    },
    method: "post",
    url: "/api/users/signin",
    onSuccess: () => Router.push("/"),
  });

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();

    doRequest();
  };

  return (
    <form onSubmit={onSubmit}>
      <h1>Sign In</h1>
      <div className="form-group">
        <label>Email Address</label>
        <input
          className="form-control"
          onChange={(e) => setEmail(e.target.value)}
          value={email}
        />
      </div>

      <div className="form-group">
        <label>Password</label>
        <input
          type="password"
          className="form-control"
          onChange={(e) => setPassword(e.target.value)}
          value={password}
        />
      </div>

      {errors}

      <button className="btn btn-primary">Sign In</button>
    </form>
  );
};

export default Signin;
