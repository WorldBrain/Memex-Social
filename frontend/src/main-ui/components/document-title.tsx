import { PureComponent } from "react";
import { DocumentTitleService } from "../../services/document-title";

interface DocumentTitleProps {
  documentTitle: DocumentTitleService;
  subTitle: string;
}

export default class DocumentTitle extends PureComponent<DocumentTitleProps> {
  titleId?: number;

  componentDidMount() {
    this.titleId = this.props.documentTitle.pushTitle(
      this._generateTitle(this.props)
    );
  }

  componentWillUnmount() {
    if (this.titleId) {
      this.props.documentTitle.popTitle(this.titleId);
    }
  }

  componentWillUpdate(nextProps: DocumentTitleProps) {
    if (this.titleId) {
      this.props.documentTitle.replaceTitle(
        this.titleId,
        this._generateTitle(nextProps.subTitle ? nextProps : this.props)
      );
    }
  }

  _generateTitle(props: Omit<DocumentTitleProps, "documentTitle">) {
    return `${props.subTitle}`;
  }

  render() {
    return null;
  }
}
