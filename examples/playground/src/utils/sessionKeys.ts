import { LibZip } from 'solady';
import {
  Address,
  encodeAbiParameters,
  encodeFunctionData,
  encodePacked,
  Hex,
  keccak256,
} from 'viem';

import smartSessionModuleAbi from '@/abi/smartSessionModule';

interface Permission {
  validator: Address;
  validatorInitData: Hex;
  salt: Hex;
}

function getPermissionId(permission: Permission): Hex {
  const { validator, validatorInitData, salt } = permission;
  return keccak256(
    encodeAbiParameters(
      [
        {
          name: 'validator',
          type: 'address',
        },
        {
          name: 'validatorInitData',
          type: 'bytes',
        },
        {
          name: 'salt',
          type: 'bytes32',
        },
      ],
      [validator, validatorInitData, salt],
    ),
  );
}

function getEnableSessionsCallData(
  permission: Permission,
  actions: {
    selector: Hex;
    target: Address;
    policies: {
      policy: Address;
      initData: Hex;
    }[];
  }[],
): Hex {
  const { validator, validatorInitData, salt } = permission;
  return encodeFunctionData({
    abi: smartSessionModuleAbi,
    functionName: 'enableSessions',
    args: [
      [
        {
          sessionValidator: validator,
          sessionValidatorInitData: validatorInitData,
          salt,
          userOpPolicies: [],
          erc7739Policies: {
            allowedERC7739Content: [],
            erc1271Policies: [],
          },
          actions: actions.map((action) => ({
            actionTargetSelector: action.selector,
            actionTarget: action.target,
            actionPolicies: action.policies,
          })),
        },
      ],
    ],
  });
}

function encodeSessionSignature(permissionId: Hex, signature: Hex): Hex {
  return encodePacked(
    ['bytes1', 'bytes32', 'bytes'],
    [
      '0x00',
      permissionId,
      LibZip.flzCompress(
        encodeAbiParameters(
          [
            {
              type: 'bytes',
            },
          ],
          [signature],
        ),
      ) as Hex,
    ],
  );
}

export { getPermissionId, getEnableSessionsCallData, encodeSessionSignature };
export type { Permission };
