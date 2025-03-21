import Navbar from "@/components/ui/navigation/navbar";
import React, { ReactNode } from "react";

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <main>
      <Navbar />

      {children}
    </main>
  );
};

export default Layout;
