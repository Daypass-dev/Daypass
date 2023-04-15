import {
  RainbowKitProvider,
  connectorsForWallets,
  darkTheme,
  getDefaultWallets,
} from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { ReactNode } from "react";
import {
  WagmiConfig,
  configureChains,
  createClient,
  goerli,
  mainnet,
} from "wagmi";
import { polygon, polygonMumbai } from "wagmi/chains";
import { publicProvider } from "wagmi/providers/public";

const { chains, provider, webSocketProvider } = configureChains(
  [...((): any[] => {
    switch (process.env.NEXT_PUBLIC_CHAIN!) {
      case "ethereum":
        return process.env.NEXT_PUBLIC_TESTNET === "true" ? [goerli] : [mainnet];
      case "polygon":
        return process.env.NEXT_PUBLIC_TESTNET === "true" ? [polygonMumbai] : [polygon];
    }

    return process.env.NEXT_PUBLIC_TESTNET === "true" ? [goerli] : [mainnet];
  })()],
  [publicProvider()]
);

const appName = "EVM Hackathon Starter";

const { wallets } = getDefaultWallets({
  appName,
  chains,
});

const connectors = connectorsForWallets(wallets);

const demoAppInfo = {
  appName,
};

const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider,
  webSocketProvider,
});

type WalletLayoutProps = {
  children: ReactNode;
};

const WalletProvider = ({ children }: WalletLayoutProps) => {
  return (
    <WagmiConfig client={wagmiClient}>
      <RainbowKitProvider
        appInfo={demoAppInfo}
        chains={chains}
        theme={darkTheme({
          borderRadius: "small",
        })}
      >
        {children}
      </RainbowKitProvider>
    </WagmiConfig>
  );
};

export default WalletProvider;