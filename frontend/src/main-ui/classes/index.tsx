import mapValues from "lodash/mapValues";
import * as reactUILogic from "ui-logic-react";
import { Services } from "../../services/types";
import * as logic from "./logic";
import { capitalize } from "../../utils/string";
import { EventHandlers } from "./events";

type UIServices = "logicRegistry" | "device";
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
  private usesStyleBreakpoints = false;

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
    super.componentDidMount();
    if (this.logic) {
      if (this.services) {
        this.services.logicRegistry.registerLogic(this.elementName, {
          events: this.logic.events,
          eventProcessor: (eventName: string, eventArgs: any) =>
            this.processEvent(eventName as any, eventArgs),
          triggerOutput: (event: string, ...args: any[]) =>
            (this.props as any)[`on${capitalize(event)}`](...args),
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

  getStyleBreakpoints<
    BreakpointDefinitions extends {
      [name: string]: number;
    }
  >(
    breakpointDefinitions: BreakpointDefinitions
  ): { [Key in keyof BreakpointDefinitions]: boolean } {
    if (!this.usesStyleBreakpoints) {
      this.usesStyleBreakpoints = true;
      this.baseEventHandlers.subscribeTo(
        this.services.device.events,
        "rootResize",
        () => {
          this.forceUpdate();
        }
      );
    }

    const rootSize = this.services.device.rootSize;
    const breakpoints = mapValues(breakpointDefinitions, (sizeLimit) => {
      return rootSize.width <= sizeLimit;
    }) as { [Key in keyof BreakpointDefinitions]: boolean };
    return breakpoints;
  }
}
