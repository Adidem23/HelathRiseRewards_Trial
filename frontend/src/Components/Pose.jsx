import { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import * as posenet from '@tensorflow-models/posenet';
import * as tf from '@tensorflow/tfjs';
import { ThirdwebSDK, useAddress, useContract, useMintNFT, useContractWrite } from "@thirdweb-dev/react";
import { ethers } from 'ethers';



const Pose = () => {

    const webcamRef = useRef(null);
    const canvasRef = useRef(null);
    const [ActivityCount, setActivityCount] = useState(0);
    const [Account, setAccount] = useState(null);
    const [Activewebcam, setActivewebcam] = useState(true);
    const [Image, setImage] = useState("");
    const address223 = useAddress();
    const { contract } = useContract("0x124bF5CdbFf3eec1508970cF3704f53BB2fa9cA9");
    const { mutateAsync: mintnft } = useMintNFT(contract);
    const { mutateAsync: mintWithSignature } = useContractWrite(contract, "mintWithSignature")

    useEffect(() => {
        runPosenet();
    }, []);

    const runPosenet = async () => {
        await tf.setBackend("webgl");

        const net = await posenet.load();

        detectPose(net);
    };

    const detectPose = async (net) => {
        if (
            webcamRef.current &&
            webcamRef.current.video.readyState === 4
        ) {
            const video = webcamRef.current.video;
            const videoWidth = video.videoWidth;
            const videoHeight = video.videoHeight;

            video.width = videoWidth;
            video.height = videoHeight;

            const pose = await net.estimateSinglePose(video);

            if (pose && pose.keypoints) {
                drawPose(pose, videoWidth, videoHeight, canvasRef);
                detectActivity(pose);
            }
        }

        requestAnimationFrame(() => {
            detectPose(net);
        });
    };

    const drawPose = (pose, videoWidth, videoHeight, canvasRef) => {
        const ctx = canvasRef.current.getContext('2d');
        canvasRef.current.width = videoWidth;
        canvasRef.current.height = videoHeight;

        drawKeypoints(pose.keypoints, ctx);
    };

    const drawKeypoints = (keypoints, ctx) => {
        for (let i = 0; i < keypoints.length; i++) {
            const keypoint = keypoints[i];

            if (keypoint.score > 0.2) {
                const { y, x } = keypoint.position;
                ctx.beginPath();
                ctx.arc(x, y, 5, 0, 2 * Math.PI);
                ctx.fillStyle = 'red';
                ctx.fill();
            }
        }
    };

    const MIN_WRIST_Y = 300;

    function detectActivity(pose) {
        const leftWrist = pose.keypoints[9];
        const rightWrist = pose.keypoints[10];

        if (!leftWrist || !rightWrist) return;

        const leftWristY = leftWrist.position.y;
        const rightWristY = rightWrist.position.y;

        if (leftWristY < MIN_WRIST_Y && rightWristY < MIN_WRIST_Y) {
            setActivityCount(prevCount => prevCount + 1);
        }
    }

    const ListNFT = async () => {

        try {

            const metadata = {
                name: "AdityaNFT",
                description: "Good NFT",
                image: Image,
            }

            const providers = new ethers.providers.Web3Provider(window.ethereum);


            const Signer = new ethers.Wallet("5ad7f7823ac4a9518b1ce47b007c63c150bc31382d6878d48cce4abb2cc707ef", providers);

            const sdkt = ThirdwebSDK.fromSigner(Signer);

            sdkt.wallet.connect(Signer);


            const contractnew = await sdkt.getContract("0x124bF5CdbFf3eec1508970cF3704f53BB2fa9cA9");


            await contractnew.roles.grant("minter", Account);


            const newSigner = providers.getSigner();
            const sdkt2 = ThirdwebSDK.fromSigner(newSigner);
            sdkt2.wallet.connect(newSigner);
            const contractnew2 = await sdkt2.getContract("0x124bF5CdbFf3eec1508970cF3704f53BB2fa9cA9");


            try {
                const payload = {
                    to: Account,
                    metadata: metadata,
                    price: '0.01'
                }
                const signpayload = await contractnew2.erc721.signature.generate(payload);
                const tx = await contractnew2.erc721.signature.mint(signpayload);
                const receipt = tx.receipt;
                const tokenId = tx.id;
                console.log(receipt, tokenId);

            } catch (err) {
                console.log("Error is Occured" + err);
            }

        } catch (err) {
            console.log("Error is occured" + err);
        }

    }

    const ListNft2 = async (contract) => {

        const metadata = {
            name: "AdityaNFT",
            description: "Good NFT",
            image: Image,
        }

        const providers = new ethers.providers.Web3Provider(window.ethereum);
        const Signer = new ethers.Wallet("5ad7f7823ac4a9518b1ce47b007c63c150bc31382d6878d48cce4abb2cc707ef", providers);

        const sdkt = ThirdwebSDK.fromSigner(Signer);

        sdkt.wallet.connect(Signer);


        const contractnew = await sdkt.getContract("0x124bF5CdbFf3eec1508970cF3704f53BB2fa9cA9");

        await contractnew.roles.grant("minter", Account);

        const payload = {
            to: address223,
            metadata: metadata,
            price: '0.01'
        }
        const signpayload = await contract.erc721.signature.generate(payload);
        const tx = await contract.erc721.signature.mint(signpayload);
        console.log(tx);
    }

    const checkwinning = async () => {
        if (ActivityCount > 100) {
            setActivityCount(0);
            setActivewebcam(false);
            const canv = document.getElementById('c');
            canv.style.display = "none";

            await ListNft2(contract);
        }
    }

    checkwinning();

    const handlemetamask = async () => {
        const { ethereum } = window;
        const spanelement = document.getElementById('span');

        const account = await ethereum.request({
            method: "eth_requestAccounts",
        });

        spanelement.innerHTML = account[0];
        setAccount(account[0]);

        ethereum.on('accountsChanged', async (accountnew) => {
            spanelement.innerHTML = accountnew[0];
            setAccount(accountnew[0]);
        })
    }


    return (

        <>
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: "stretch" }}>
                <h3>Connected Account:<span id='span'></span></h3>
                <button onClick={handlemetamask} style={{ width: "fit-content", height: "fit-content", marginTop: "20px" }}>Connect Metamask</button>
            </div>

            <img src={Image} alt="No Image Generated" height="80px" width="80px" />

            <br />
            <br />
            <br />
            <br />


            <div className="App">

                {Activewebcam && <Webcam ref={webcamRef} className="webcam" style={{
                    position: "absolute",
                    marginLeft: "auto",
                    marginRight: "auto",
                    left: 0,
                    right: 0,
                    textAlign: "center",
                    zIndex: 9,
                    width: 640,
                    height: 480,
                }} />}

                <canvas ref={canvasRef} className="canvas" id='c' style={{
                    position: "absolute",
                    marginLeft: "auto",
                    marginRight: "auto",
                    left: 0,
                    right: 0,
                    textAlign: "center",
                    zIndex: 9,
                    width: 640,
                    height: 480,
                }} />
                <div className="activity-count" >Activity Count:{ActivityCount}</div>
            </div>
        </>

    )
}

export default Pose;