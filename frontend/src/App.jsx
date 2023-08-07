import Pose from "./Components/Pose";
import { ThirdwebSDKProvider } from "@thirdweb-dev/react";
import {ethers} from 'ethers';

function App() {
  const ActiveChainId = 80001;

  return (
    <>
      <ThirdwebSDKProvider activeChain={ActiveChainId}  signer={new ethers.providers.Web3Provider(window.ethereum).getSigner()} clientId="5fb26c268ed64fb73d9fb6010411dca9">
        <Pose />
      </ThirdwebSDKProvider>
    </>
  )
}

export default App
