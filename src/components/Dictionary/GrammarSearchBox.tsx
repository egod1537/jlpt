import { PureComponent, type ChangeEvent } from "react";

interface GrammarSearchBoxProps {
  query: string;
  onQueryChange: (query: string) => void;
}

export class GrammarSearchBox extends PureComponent<GrammarSearchBoxProps> {
  private handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    this.props.onQueryChange(event.target.value);
  };

  render() {
    return (
      <div className="search-box">
        <input
          type="text"
          placeholder="문법 검색..."
          value={this.props.query}
          onChange={this.handleChange}
        />
      </div>
    );
  }
}
