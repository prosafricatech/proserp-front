import React from "react";
import { useJumboLayout } from "../../hooks";
import { JumboLayoutAside } from "./JumboLayoutAside";
import { JumboLayoutDrawer } from "./JumboLayoutDrawer";

export default function JumboLayoutSidebar({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarOptions } = useJumboLayout();

  if (sidebarOptions.drawer) {
    return <JumboLayoutDrawer>{children}</JumboLayoutDrawer>;
  }
  return <JumboLayoutAside>{children}</JumboLayoutAside>;
}
