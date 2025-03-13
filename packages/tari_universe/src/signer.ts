import {
  SubmitTransactionResponse,
  Account,
  Substate,
  TemplateDefinition,
  VaultBalances,
  ListSubstatesResponse,
  SubmitTransactionRequest,
  TariSigner,
  TransactionResult,
} from "@tari-project/tari-signer";
import {
  SignerRequest,
  SignerMethodNames,
  SignerReturnType,
  TariUniverseSignerParameters,
  WindowSize,
  ListAccountNftFromBalancesRequest,
} from "./types";
import {
  AccountsGetBalancesResponse,
  ListAccountNftRequest,
  ListAccountNftResponse,
  SubstateType,
} from "@tari-project/wallet_jrpc_client";
import { sendSignerCall } from "./utils";

export class TariUniverseSigner implements TariSigner {
  public signerName = "TariUniverse";
  private __id = 0;

  public constructor(public params: TariUniverseSignerParameters) {
    const filterResizeEvent = function (event: MessageEvent) {
      if (event.data && event.data.type === "resize") {
        const resizeEvent = new CustomEvent("resize", {
          detail: { width: event.data.width, height: event.data.height },
        });
        window.dispatchEvent(resizeEvent);
      }
    };
    window.addEventListener("message", (event) => filterResizeEvent(event), false);
  }

  private async sendRequest<MethodName extends SignerMethodNames>(
    req: Omit<SignerRequest<MethodName>, "id">,
  ): Promise<SignerReturnType<MethodName>> {
    const id = ++this.__id;
    return sendSignerCall(req, id);
  }

  public isConnected(): boolean {
    return true;
  }

  public getPublicKey(): Promise<string> {
    return this.sendRequest<"getPublicKey">({ methodName: "getPublicKey", args: [] });
  }

  public async listSubstates(
    filter_by_template: string | null,
    filter_by_type: SubstateType | null,
    limit: number | null,
    offset: number | null,
  ): Promise<ListSubstatesResponse> {
    return this.sendRequest<"listSubstates">({
      methodName: "listSubstates",
      args: [filter_by_template, filter_by_type, limit, offset],
    });
  }

  public getConfidentialVaultBalances(
    viewKeyId: number,
    vaultId: string,
    min: number | null,
    max: number | null,
  ): Promise<VaultBalances> {
    return this.sendRequest({
      methodName: "getConfidentialVaultBalances",
      args: [viewKeyId, vaultId, min, max],
    });
  }

  public async createFreeTestCoins(): Promise<void> {
    return this.sendRequest({ methodName: "createFreeTestCoins", args: [] });
  }

  public requestParentSize(): Promise<WindowSize> {
    return this.sendRequest({ methodName: "requestParentSize", args: [] });
  }

  public async getAccount(): Promise<Account> {
    return this.sendRequest({ methodName: "getAccount", args: [] });
  }

  public async getAccountBalances(componentAddress: string): Promise<AccountsGetBalancesResponse> {
    return this.sendRequest({
      methodName: "getAccountBalances",
      args: [componentAddress],
    });
  }

  public async getSubstate(substate_id: string): Promise<Substate> {
    return this.sendRequest({
      methodName: "getSubstate",
      args: [substate_id],
    });
  }

  public async submitTransaction(req: SubmitTransactionRequest): Promise<SubmitTransactionResponse> {
    return this.sendRequest({
      methodName: "submitTransaction",
      args: [req],
    });
  }

  public async getTransactionResult(transactionId: string): Promise<TransactionResult> {
    return this.sendRequest({
      methodName: "getTransactionResult",
      args: [transactionId],
    });
  }

  public async getTemplateDefinition(template_address: string): Promise<TemplateDefinition> {
    return this.sendRequest({ methodName: "getTemplateDefinition", args: [template_address] });
  }

  public async getNftsList(req: ListAccountNftRequest): Promise<ListAccountNftResponse> {
    return this.sendRequest({ methodName: "getNftsList", args: [req] });
  }

  public async getNftsFromAccountBalances(req: ListAccountNftFromBalancesRequest): Promise<ListAccountNftResponse> {
    return this.sendRequest({ methodName: "getNftsFromAccountBalances", args: [req] });
  }
}
