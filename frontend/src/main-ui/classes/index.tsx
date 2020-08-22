import mapValues from "lodash/mapValues";
import * as reactUILogic from "ui-logic-react";
import { Services } from "../../services/types";
import * as logic from "./logic";
import { EventHandlers } from "./events";

type UIServices = "logicRegistry" | "device" | "documentTitle";
export type UIElementServices<Wanted extends keyof Services = never> = Pick<
  Services,
  UIServices | Wanted
>;

export abstract class UIElement<
  Props extends { services: UIElementServices } = {
    services: UIElementServices;
  },
  State = {},
  Event extends logic.UIEvent<{}> = logic.UIEvent<{}>
> extends reactUILogic.UIElement<Props, State, Event> {
  private services: Pick<Services, UIServices>;
  private baseEventHandlers = new EventHandlers();
  private needsViewportSize = false;

  constructor(
    props: Props,
    options: { logic?: logic.UILogic<State, Event> } = {}
  ) {
    super(props, options);

    this.services = props.services;
  }

  get elementName() {
    return Object.getPrototypeOf(this).constructor.name;
  }

  componentDidMount() {
    if (this.logic) {
      this.logic.events.once("initialized", () =>
        this.services.logicRegistry.setAttribute(
          this.elementName,
          "initialized",
          true
        )
      );
    }
    super.componentDidMount();
    if (this.logic) {
      if (this.services) {
        this.services.logicRegistry.registerLogic(this.elementName, {
          events: this.logic.events,
          eventProcessor: (eventName: string, eventArgs: any) =>
            this.processEvent(eventName as any, eventArgs),
        });
      }
    }
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    if (this.logic) {
      if (this.services) {
        this.services.logicRegistry.unregisterLogic(this.elementName);
      }
    }
    this.baseEventHandlers.unsubscribeAll();
  }

  getViewportSize() {
    if (!this.needsViewportSize) {
      this.needsViewportSize = true;
      this.baseEventHandlers.subscribeTo(
        this.services.device.events,
        "rootResize",
        () => {
          this.forceUpdate();
        }
      );
    }

    return this.services.device.rootSize;
  }

  getViewportWidth() {
    return this.getViewportSize().width;
  }

  getStyleBreakpoints<
    BreakpointDefinitions extends {
      [name: string]: number;
    }
  >(
    breakpointDefinitions: BreakpointDefinitions
  ): { [Key in keyof BreakpointDefinitions]: boolean } {
    const rootSize = this.getViewportSize();
    const breakpoints = mapValues(breakpointDefinitions, (sizeLimit) => {
      return rootSize.width <= sizeLimit;
    }) as { [Key in keyof BreakpointDefinitions]: boolean };
    return breakpoints;
  }
}
