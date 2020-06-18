import { ProgramQueryParams } from "../setup/types";

export interface DevelopmentRpcInterface {
    run(options : { queryParams : ProgramQueryParams }) : Promise<void>
    stepWalkthrough() : Promise<void>
}
export type DevelopmentRpcRequest = { func : string, args : any[] }
export type DevelopmentRpcResponse = { success : boolean, data : any }
