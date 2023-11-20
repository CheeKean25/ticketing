import { useEffect } from "react";
import useRequest from "../../hooks/useRequest";
import Router from "next/router";

const Signout = () => {
  const { doRequest } = useRequest({
    method: "post",
    url: "/api/users/signout",
    body: {},
    onSuccess: () => Router.push("/"),
  });

  useEffect(() => {
    doRequest();
  }, []);

  return <div>Signing you out...</div>;
};

export default Signout;
