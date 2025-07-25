import { TariUniverseSigner } from "@tari-project/tari-universe-signer";
import { TariSigner } from "@tari-project/tari-signer";
import { TransactionResult, UnsignedTransactionV1 } from "@tari-project/typescript-bindings";
import {
  DownSubstates,
  UpSubstates,
  SubmitTransactionRequest,
  TransactionStatus,
  SimpleTransactionResult,
} from "@tari-project/tarijs-types";

export function buildTransactionRequest(
  transaction: UnsignedTransactionV1,
  accountId: number,
  detectInputsUseUnversioned = true,
): SubmitTransactionRequest {
  return {
    transaction,
    account_id: accountId,
    detect_inputs_use_unversioned: detectInputsUseUnversioned,
  };
}

export async function submitAndWaitForTransaction(
  signer: TariSigner,
  req: SubmitTransactionRequest,
): Promise<SimpleTransactionResult> {
  try {
    const response = await signer.submitTransaction(req);
    return await waitForTransactionResult(signer, response.transaction_id);
  } catch (e) {
    throw new Error(`Transaction failed: ${e}`);
  }
}

export async function waitForTransactionResult(
  signer: TariSigner | TariUniverseSigner,
  transactionId: string,
): Promise<SimpleTransactionResult> {
  while (true) {
    const resp = await signer.getTransactionResult(transactionId);
    const FINALIZED_STATUSES = [
      TransactionStatus.Accepted,
      TransactionStatus.Rejected,
      TransactionStatus.InvalidTransaction,
      TransactionStatus.OnlyFeeAccepted,
      TransactionStatus.DryRun,
    ];

    if (resp.status == TransactionStatus.Rejected) {
      throw new Error(`Transaction rejected: ${JSON.stringify(resp.result)}`);
    }
    if (!resp.result?.result) {
      throw new Error(`Transaction finalized but the result is undefined`);
    }
    if (FINALIZED_STATUSES.includes(resp.status)) {
      if (!resp.result) {
        throw new Error(`BUG: Transaction result is empty for transaction ID: ${transactionId}`);
      }

      return SimpleTransactionResult.fromResponse(resp);
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

/** @public */
export function getAcceptResultSubstates(txResult: TransactionResult): {
  upSubstates: UpSubstates;
  downSubstates: DownSubstates;
} {
  if ("Reject" in txResult) {
    throw new Error(`Transaction rejected: ${txResult.Reject}`);
  }

  if ("Accept" in txResult) {
    return {
      upSubstates: txResult.Accept.up_substates,
      downSubstates: txResult.Accept.down_substates,
    };
  }

  if ("AcceptFeeRejectRest" in txResult) {
    return {
      upSubstates: txResult.AcceptFeeRejectRest[0].up_substates,
      downSubstates: txResult.AcceptFeeRejectRest[0].down_substates,
    };
  }

  throw new Error(`Unexpected transaction result: ${JSON.stringify(txResult)}`);
}
