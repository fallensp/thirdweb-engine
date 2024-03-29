import { Static, Type } from "@sinclair/typebox";
import { ethers } from "ethers";
import { FastifyInstance } from "fastify";
import { StatusCodes } from "http-status-codes";
import { getWallet } from "../../../utils/cache/getWallet";
import { standardResponseSchema } from "../../schemas/sharedApiSchemas";
import { walletAuthSchema } from "../../schemas/wallet";

const BodySchema = Type.Object({
  message: Type.String(),
  isBytes: Type.Optional(Type.Boolean()),
});

const ReplySchema = Type.Object({
  result: Type.String(),
});

export async function signMessage(fastify: FastifyInstance) {
  fastify.route<{
    Body: Static<typeof BodySchema>;
    Reply: Static<typeof ReplySchema>;
  }>({
    method: "POST",
    url: "/backend-wallet/sign-message",
    schema: {
      summary: "Sign a message",
      description: "Send a message",
      tags: ["Backend Wallet"],
      operationId: "signMessage",
      body: BodySchema,
      headers: Type.Omit(walletAuthSchema, ["x-account-address"]),
      response: {
        ...standardResponseSchema,
        [StatusCodes.OK]: ReplySchema,
      },
    },
    handler: async (req, res) => {
      const { message, isBytes } = req.body;
      const walletAddress = req.headers["x-backend-wallet-address"] as string;

      const wallet = await getWallet({
        chainId: 1,
        walletAddress,
      });

      const signer = await wallet.getSigner();

      let signedMessage;
      if (isBytes) {
        signedMessage = await signer.signMessage(
          ethers.utils.arrayify(message),
        );
      } else {
        signedMessage = await signer.signMessage(message);
      }

      res.status(200).send({
        result: signedMessage,
      });
    },
  });
}
