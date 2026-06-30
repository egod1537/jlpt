import { PureComponent, type ReactNode } from "react";

interface SidebarProps {
  children: ReactNode;
}

export class Sidebar extends PureComponent<SidebarProps> {
  render() {
    return <aside className="sidebar">{this.props.children}</aside>;
  }
}
