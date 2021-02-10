import { UIEvent } from "../../../../main-ui/classes/logic";
import { UIElementServices } from "../../../../main-ui/classes";
import { StorageModules } from "../../../../storage/types";
import { UITaskState } from "../../../../main-ui/types";
import { UserReference } from "../../../user-management/types";

export interface WebMonetizationButtonDependencies {
  services: UIElementServices<"userManagement" | 'webMonetization'>;
  storage: Pick<StorageModules, "users">;
  userRef: UserReference;
  paymentPointer: string;
}

export interface WebMonetizationButtonState {
  isDisplayed: boolean;
  paymentMade: boolean;
  initialLoadTaskState: UITaskState
  makePaymentTaskState: UITaskState;
}

export type WebMonetizationButtonEvent = UIEvent<{
  makeSupporterPayment: null;
}>;
