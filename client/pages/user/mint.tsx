import {
  Button,
  Card,
  CardBody,
  Heading,
  Input,
  Text,
  Image as ChakraImage,
  Flex,
} from "@chakra-ui/react";
import Head from "next/head";
import WalletLayout from "./wallet/WalletLayout";
import { useAccount } from "wagmi";
import { getZeroDevSigner, getSocialWalletOwner } from "@zerodevapp/sdk";
import nftArtifact from "../../contracts/Simple721.sol/Simple721.json";
import { GoogleSocialWallet } from "@zerodevapp/social-wallet";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Contract, providers } from "ethers";
import { Interface } from "ethers/lib/utils.js";
import { PaymasterAPI } from "@account-abstraction/sdk";
import { UserOperationStruct } from "@account-abstraction/contracts";
import Link from "next/link";
import { useNetwork } from "wagmi";
import {
  LOCALSTORAGE_KEY_DAY_PASS_ADDRESS,
  LOCALSTORAGE_PAYMASTER_ADDRESS,
} from "../../consts/localstorage";
import { MUMBAI_SPACE_CAN_COLLECTION, SPACE_CAN } from "../../consts/address";

// const NFT_CONTRACT_ADDRESS = "0x38853627cadCB75B7537453b12bFc2AB6eE16E23";
// const PAYMASTER_ADDRESS = "0xF66b5E3Cb034391d44E09365A2150a5E60a9c53d"; // paymaster with whitelisted addresses, latest version

class contractOnlyPaymaster extends PaymasterAPI {
  public address: string;

  constructor(address: string) {
    super();
    this.address = address;
  }

  async getPaymasterAndData(
    userOp: Partial<UserOperationStruct>
  ): Promise<string> {
    return this.address;
  }
}

export default function Home() {
  const { address } = useAccount();
  const { chain } = useNetwork();

  const [isLoading, setIsLoading] = useState(false);
  const [mintingErrorMessage, setErrorMessage] = useState("");
  const [transactionHash, setTransactionHash] = useState(undefined);

  const [nftContractAddress, setNftContractAddress] = useState("");
  const [paymasterAddress, setPaymasterAddress] = useState("");

  console.log("Space cans address");
  console.log(nftContractAddress);

  const projectID = useMemo(() => {
    switch (chain?.network) {
      case "goerli":
        return process.env.NEXT_PUBLIC_ZERO_DEV_PROJECT_ID;
      case "maticmum":
        return process.env.NEXT_PUBLIC_ZERO_DEV_PROJECT_ID_MUMBAI;
    }
  }, [chain?.network]);

  console.log("ProjectId");
  console.log(projectID);

  console.log("paymasterAddress", paymasterAddress);

  const loadNFTContractAddress = useCallback((chainName: string) => {
    switch (chainName) {
      case "GOERLI":
        return SPACE_CAN;
      case "MATICMUM":
        return MUMBAI_SPACE_CAN_COLLECTION;
      default:
        console.log("Unsupported demo chain, pls switch");
        return SPACE_CAN;
    }
  }, []);

  useEffect(() => {
    const chainName = (chain?.network ?? "").toUpperCase();

    setNftContractAddress(loadNFTContractAddress(chainName));
    setPaymasterAddress(
      localStorage.getItem(`${LOCALSTORAGE_PAYMASTER_ADDRESS}_${chainName}`) ??
        ""
    );
  }, [chain?.network]);

  const handleChange = (event: any) => setPaymasterAddress(event.target.value);

  const mint = async () => {
    setIsLoading(true);
    try {
      console.log("trying to mint..");
      const socialWallet = new GoogleSocialWallet();

      const signer = await getZeroDevSigner({
        projectId: projectID!,
        owner: await getSocialWalletOwner(projectID!, socialWallet),
      });

      signer.smartAccountAPI.paymasterAPI = new contractOnlyPaymaster(
        paymasterAddress
      );

      const contract = new Contract(
        nftContractAddress!,
        new Interface(nftArtifact.abi),
        signer
      );

      const txn: providers.TransactionResponse = await contract.mint(1);
      setTransactionHash(txn.hash as any);

      const receipt = await txn.wait();
    } catch (e) {
      console.log(e);
      setErrorMessage("Minting Failed. Retry");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log(
      `Hey, the address state is changing here's the new value ${address}`
    );
    setErrorMessage("");
  }, [address]);

  useEffect(() => {
    console.log("Every udpate rerender..");
    if (localStorage) {
      console.log("Local storage instance");
      const paymasterAddress = localStorage.getItem(
        LOCALSTORAGE_PAYMASTER_ADDRESS
      );
      if (paymasterAddress) {
        setPaymasterAddress(paymasterAddress);
      }
    }
  }, []);
  return (
    <>
      <WalletLayout>
        <Flex
          justifyContent="center"
          alignItems="center"
          flexDir="column"
          width="100%"
          height="100vh"
        >
          <Head>
            <title>Demo Mint Site</title>
            <meta name="description" content="Generated by create next app" />
            <link rel="icon" href="/favicon.ico" />
          </Head>
          <Flex justifyContent="center" alignItems="center" flexDirection="row">
            <Flex flexDirection="column" mr="25px">
              <Heading color="#FFFFFF">Space Can NFT Collection</Heading>
              <Text color="#FFFFFF" fontSize="md" width="50vw">
                Space Cans is an NFT collection that features unique and playful
                3D illustrations of soda cans floating in outer space. Each can
                has its own distinct personality and is ready to conquer the
                universe.
              </Text>
              <Input
                value={paymasterAddress}
                onChange={handleChange}
                placeholder="Paymaster Address"
                color="#FFFFFF"
                _placeholder={{ color: "inherit", opacity: 1 }}
                mt="28px"
                mb="24px"
                style={{ zIndex: 2, width: "50vw" }}
              />
              <Button
                bg="#FF44EC"
                onClick={mint}
                isDisabled={!address}
                width="50vw"
              >
                {isLoading
                  ? "Minting in progress..."
                  : mintingErrorMessage !== ""
                  ? mintingErrorMessage
                  : "Mint NFT"}
              </Button>
            </Flex>
            <Flex flexDirection="column">
              <Card>
                <ChakraImage src="/space-can.png" width="20vw"></ChakraImage>
              </Card>
            </Flex>
          </Flex>

          {transactionHash ? (
            <Link
              style={{ marginTop: "10px" }}
              href={`https://www.jiffyscan.xyz/userOpHash/${transactionHash}?network=goerli`}
              passHref
            >
              <Button as="a">See your transaction</Button>
            </Link>
          ) : (
            <></>
          )}
        </Flex>
      </WalletLayout>
    </>
  );
}
