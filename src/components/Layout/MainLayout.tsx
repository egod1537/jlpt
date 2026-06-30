import { PureComponent, type ReactNode } from "react";

interface MainLayoutProps {
  children: ReactNode;
}

export class MainLayout extends PureComponent<MainLayoutProps> {
  render() {
    return <main className="main-layout">{this.props.children}</main>;
  }
}
