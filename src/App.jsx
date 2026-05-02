import { lazy, Suspense } from "react";
import CustomerPage from "./pages/CustomerPage.jsx";

const AdminPage = lazy(() => import("./pages/AdminPage.jsx"));
const ProductPage = lazy(() => import("./pages/ProductPage.jsx"));

function RouteFallback() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        color: "var(--text-muted)",
      }}
    >
      <span className="font-mono" style={{ fontSize: 11, letterSpacing: "0.25em" }}>
        LOADING...
      </span>
    </div>
  );
}

export default function App() {
  const path = window.location.pathname;
  const route = path.startsWith("/product/") ? "/product" : path === "/admin" ? "/admin" : "/";
  const productId = path.startsWith("/product/") ? path.split("/product/")[1] : null;

  if (route === "/product" && productId) {
    return (
      <Suspense fallback={<RouteFallback />}>
        <ProductPage id={productId} />
      </Suspense>
    );
  }
  if (route === "/admin") {
    return (
      <Suspense fallback={<RouteFallback />}>
        <AdminPage />
      </Suspense>
    );
  }
  return <CustomerPage />;
}
