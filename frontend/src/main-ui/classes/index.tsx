import { Component } from "react";
import classNames from "classnames";
import { Services } from "../../services/types";
import MESSAGES from "../messages";
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
> extends Component<Props, State> {
  public logic?: logic.UILogic<State, Event>;
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
    super(props);

    this.logic = options.logic;
    if (this.logic) {
      const initialState = this.logic.getInitialState();
      if (initialState) {
        (this as any).state = this.logic.getInitialState();
      }
    }

    this.services = props.services;
  }

  protected get styles(): { [elementName: string]: string } {
    const styles = this.services.styleRegistry.getStyleModule(
      this.styleModule || this.elementName
    );
    if (!this.styleBreakpoints && !this.styleClasses) {
      return styles;
    }

    return new Proxy(
      {},
      {
        get: (target, key) => {
          const classes: string[] = [styles[key as string]];
          if (key === "container" && this.styleBreakpoints) {
            classes.push(...this.getBreakpointClassNames(styles));
          }
          if (this.styleClasses) {
            for (const [className, condition] of Object.entries(
              this.styleClasses[key as string] || {}
            )) {
              if (condition(this.state)) {
                classes.push(styles[className]);
              }
            }
          }
          return classNames(classes);
        },
      }
    );
  }

  getText(id: string, options: { default?: string } = {}) {
    return MESSAGES[id] || options.default || "MISSING TEXT";
  }

  async processEvent<EventName extends keyof Event>(
    eventName: EventName,
    event: Event[EventName]
  ) {
    if (!this.logic) {
      throw new Error("Tried to process event in UIElement without logic");
    }
    const mutation = await this.logic.processUIEvent(eventName, {
      state: this.state,
      event,
      direct: true,
    });
    if (mutation) {
      this.processMutation(mutation);
    }
  }

  processMutation(mutation: logic.UIMutation<State>) {
    // console.log('Mutation for "%s": %o', this.elementName, mutation)

    if (this.logic) {
      const newState = this.logic.withMutation(this.state, mutation as any);
      this.setState(newState);
    }
  }

  componentWillMount() {
    if (this.logic) {
      this.logic.events.addListener("mutation", (mutation) =>
        this.processMutation(mutation)
      );
    }
  }

  get elementName() {
    return Object.getPrototypeOf(this).constructor.name;
  }

  componentDidMount() {
    if (this.logic) {
      this.logic.processUIEvent("init", {
        state: this.state,
        event: undefined,
        optional: true,
      });
      if (this.services) {
        this.services.logicRegistry.registerLogic(this.elementName, {
          events: this.logic.events,
          eventProcessor: (event: any) => this.processEvent(event.type, event),
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
    if (this.logic) {
      this.logic.processUIEvent("cleanup", {
        state: this.state,
        event: undefined,
        optional: true,
      });
      this.logic.events.removeAllListeners();
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
