export type ConnectorAction="read"|"create"|"update"|"delete";export type CapabilityStatus="available"|"configured"|"scope_missing"|"approval_required"|"disabled"|"not_implemented";
export interface ConnectorCapability{connector:"google_calendar"|"google_tasks"|"obsidian";action:ConnectorAction;status:CapabilityStatus;scope?:string;approvalClass?:string;verified:boolean;reason?:string}
export type ActionOrigin="user_direct"|"agent_proposal"|"scheduled";
export interface ExternalActionProposal{id:string;connector:ConnectorCapability["connector"];action:ConnectorAction;origin:ActionOrigin;targetId:string;exactPayload:Record<string,unknown>;currentHash?:string;approvalClass:string;destructive:boolean}
