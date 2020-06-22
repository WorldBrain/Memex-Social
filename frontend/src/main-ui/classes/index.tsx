import * as reactUILogic from "ui-logic-react";
import { Services } from "../../services/types";
import * as logic from "./logic";
import { capitalize } from "../../utils/string";
import { EventHandlers } from "./events";

type UIServices = "logicRegistry" | "styleRegistry" | "device";
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
  protected styleModule?: string;
  protected styleBreakpoints?: { [name: string]: number };
  protected styleClasses?: {
    [elementName: string]: { [className: string]: (state: State) => boolean };
  };
  private services: Pick<Services, UIServices>;
  private baseEventHandlers = new EventHandlers();

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
    if (this.styleBreakpoints) {
      this.baseEventHandlers.subscribeTo(
        this.services.device.events,
        "rootResize",
        () => {
          this.forceUpdate();
        }
      );
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

  private getBreakpointClassNames(styles: {
    [name: string]: string;
  }): string[] {
    if (!this.styleBreakpoints) {
      return [];
    }

    const classNames: string[] = [];
    const rootSize = this.services.device.rootSize;
    for (const [key, sizeLimit] of Object.entries(this.styleBreakpoints)) {
      if (rootSize.width <= sizeLimit) {
        classNames.push(styles[`breakpoint-${key}`]);
      }
    }
    return classNames;
  }
}
