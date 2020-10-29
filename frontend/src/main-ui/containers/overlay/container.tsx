import React from "react";
import styled from "styled-components";
import { UIElement, UIElementServices } from "../../classes";

const StyledOverlayContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background-color: ${(props) => props.theme.colors.overlay.background};
  backdrop-filter: blur(3px);
  z-index: ${(props) => props.theme.zIndices.overlay};
`;

const OverlayContent = styled.div`
  background-color: ${(props) => props.theme.colors.overlay.dialog};
  top: 50%;
  width: 90%;
  max-width: 600px;
  min-height: 200px;
  padding: 20px;
`;

interface OverlayContainerProps {
  services: UIElementServices<"overlay">;
}
export class OverlayContainer extends UIElement<
  OverlayContainerProps,
  { content: any }
> {
  styleModule = "Overlay";

  private rootElement?: HTMLElement | null;
  private overlaysById: { [id: string]: any } = {};
  private overlayStack: string[] = [];

  constructor(props: OverlayContainerProps) {
    super(props);

    this.state = { content: null };
    this.props.services.overlay.events.on(
      "content.updated",
      ({ id, content }) => {
        if (content) {
          const isNew = !this.overlaysById[id];
          this.overlaysById[id] = content;
          if (isNew) {
            this.overlayStack.push(id);
          }
        } else {
          this.overlayStack.splice(
            this.overlayStack.findIndex((elem) => elem === id),
            1
          );
          delete this.overlaysById[id];
        }
        this.setState({
          content: this.overlayStack.length
            ? this.overlaysById[this.overlayStack.slice(-1)[0]]
            : null,
        });
      }
    );
  }

  componentDidMount() {}

  handleContainerClick(event: any) {
    const isDirectContainerClick = event.target === this.rootElement;
    if (isDirectContainerClick) {
      this.props.services.overlay.events.emit("closeRequest");
    }
  }

  render() {
    if (!this.state.content) {
      return null;
    }

    return (
      <StyledOverlayContainer
        ref={(element) => {
          this.rootElement = element;
        }}
        onClick={(event) => this.handleContainerClick(event)}
      >
        <OverlayContent>{this.state.content}</OverlayContent>
      </StyledOverlayContainer>
    );
  }
}
