import type * as history from "history";
import { Services } from "../../services/types";
import { Storage } from "../../storage/types";

export type UITaskState = 'pristine' | 'running' | 'success' | 'error'

export type UiRunner = (options: {
    services: Services;
    storage: Storage;
    history: history.History;
}) => Promise<void>
