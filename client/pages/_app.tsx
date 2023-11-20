import "bootstrap/dist/css/bootstrap.css";
import buildClient from "../api/build-client";
import Headers from "../components/headers";

interface AppProps {
  Component: any;
  pageProps: any;
  currentUser: any;
}

const AppComponent = ({ Component, pageProps, currentUser }: AppProps) => {
  return (
    <div>
      <Headers currentUser={currentUser} />
      <div className="container">
        <Component currentUser={currentUser} {...pageProps} />
      </div>
    </div>
  );
};

// SSR
// Different parameter as it wil have component and ctx (ctx)
AppComponent.getInitialProps = async ({ Component, ctx }) => {
  const client = buildClient(ctx);
  let pageProps = {};
  try {
    const { data } = await client.get("/api/users/currentuser");
    if (Component.getInitialProps) {
      pageProps = await Component.getInitialProps(
        ctx,
        client,
        data.currentUser
      );
    }
    return {
      pageProps,
      ...data,
    };
  } catch (error) {
    console.log(error);
    return {
      pageProps,
    };
  }
};

export default AppComponent;
