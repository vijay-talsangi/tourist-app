import { useWalletConnectModal } from "@walletconnect/modal-react-native";
import { ethers } from "ethers";
import { CameraView, useCameraPermissions } from "expo-camera";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Linking,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

// ---- CONFIG ----
const RPC_URL = "https://sepolia.infura.io/v3/YOUR_KEY"; // Infura/Alchemy RPC
const CHAIN_ID = 11155111; // Sepolia (change if Polygon Amoy etc.)
const CONTRACT_ADDRESS = "0x327FBD979a30F12cC338C66261f861c4E96Db125";

// Minimal ABI from your contract
const UPI_REGISTRY_ABI = [
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "upiId",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "name",
				"type": "string"
			}
		],
		"name": "addReceiver",
		"outputs": [
			{
				"internalType": "bytes32",
				"name": "",
				"type": "bytes32"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "bytes32",
				"name": "receiverId",
				"type": "bytes32"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amountPaise",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "upiTxnId",
				"type": "string"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			}
		],
		"name": "PaymentRecorded",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "bytes32",
				"name": "receiverId",
				"type": "bytes32"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "upiId",
				"type": "string"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "name",
				"type": "string"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "addedBy",
				"type": "address"
			}
		],
		"name": "ReceiverAdded",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "receiverId",
				"type": "bytes32"
			},
			{
				"internalType": "uint256",
				"name": "amountPaise",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "upiTxnId",
				"type": "string"
			}
		],
		"name": "recordUPIPayment",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "upiId",
				"type": "string"
			}
		],
		"name": "findReceiverIdByUPI",
		"outputs": [
			{
				"internalType": "bytes32",
				"name": "receiverId",
				"type": "bytes32"
			},
			{
				"internalType": "bool",
				"name": "exists",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getMyPayments",
		"outputs": [
			{
				"components": [
					{
						"internalType": "address",
						"name": "from",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "to",
						"type": "address"
					},
					{
						"internalType": "bytes32",
						"name": "receiverId",
						"type": "bytes32"
					},
					{
						"internalType": "uint256",
						"name": "amountPaise",
						"type": "uint256"
					},
					{
						"internalType": "string",
						"name": "upiTxnId",
						"type": "string"
					},
					{
						"internalType": "uint256",
						"name": "timestamp",
						"type": "uint256"
					}
				],
				"internalType": "struct UPIRegistry.Payment[]",
				"name": "",
				"type": "tuple[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "user",
				"type": "address"
			}
		],
		"name": "getPaymentsOf",
		"outputs": [
			{
				"components": [
					{
						"internalType": "address",
						"name": "from",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "to",
						"type": "address"
					},
					{
						"internalType": "bytes32",
						"name": "receiverId",
						"type": "bytes32"
					},
					{
						"internalType": "uint256",
						"name": "amountPaise",
						"type": "uint256"
					},
					{
						"internalType": "string",
						"name": "upiTxnId",
						"type": "string"
					},
					{
						"internalType": "uint256",
						"name": "timestamp",
						"type": "uint256"
					}
				],
				"internalType": "struct UPIRegistry.Payment[]",
				"name": "",
				"type": "tuple[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "receiverId",
				"type": "bytes32"
			}
		],
		"name": "getPaymentsTo",
		"outputs": [
			{
				"components": [
					{
						"internalType": "address",
						"name": "from",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "to",
						"type": "address"
					},
					{
						"internalType": "bytes32",
						"name": "receiverId",
						"type": "bytes32"
					},
					{
						"internalType": "uint256",
						"name": "amountPaise",
						"type": "uint256"
					},
					{
						"internalType": "string",
						"name": "upiTxnId",
						"type": "string"
					},
					{
						"internalType": "uint256",
						"name": "timestamp",
						"type": "uint256"
					}
				],
				"internalType": "struct UPIRegistry.Payment[]",
				"name": "",
				"type": "tuple[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "receiverId",
				"type": "bytes32"
			}
		],
		"name": "getReceiver",
		"outputs": [
			{
				"internalType": "string",
				"name": "upiId",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "name",
				"type": "string"
			},
			{
				"internalType": "address",
				"name": "addedBy",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "createdAt",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "exists",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];

export default function TransactionsScreen() {
  // WalletConnect
  const { open, isConnected, provider } = useWalletConnectModal();

  // QR / Camera
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);

  // Receiver & Txn state
  const [receiverId, setReceiverId] = useState("");
  const [receiver, setReceiver] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [upiTxnId, setUpiTxnId] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // ethers provider + contract
  const ethersProvider = useMemo(() => {
    if (!provider) return null;
    // @ts-ignore - wrap EIP-1193
    return new ethers.BrowserProvider(provider, { chainId: CHAIN_ID });
  }, [provider]);

  const contract = useMemo(() => {
    if (!ethersProvider) return null;
    return new ethers.Contract(CONTRACT_ADDRESS, UPI_REGISTRY_ABI, ethersProvider);
  }, [ethersProvider]);

  // ---- FUNCTIONS ----
  async function connectWallet() {
    try {
      if (!isConnected) await open();
    } catch (err: any) {
      Alert.alert("Wallet", err?.message ?? "Failed to connect");
    }
  }

  async function fetchReceiverDetails(idHex: string) {
    if (!contract) return;
    try {
      const res = await contract.getReceiver(idHex);
      const [upiId, name, addedBy, createdAt, exists] = res;
      setReceiver({ upiId, name, addedBy, createdAt: Number(createdAt), exists });
    } catch (err: any) {
      Alert.alert("Fetch", err?.reason ?? err?.message ?? "Error fetching receiver");
    }
  }

  async function fetchHistory() {
    if (!contract || !ethersProvider) return;
    try {
	  const items = await contract.getMyPayments();
	  setHistory([...items].reverse());
    } catch {
      // ignore
    }
  }

  const onScan = (result: any) => {
    setScanning(false);
    const data = result.data;
    if (!data || !data.startsWith("0x") || data.length !== 66) {
      Alert.alert("Scan", "Invalid QR format. Expecting bytes32 hex string.");
      return;
    }
    setReceiverId(data);
    fetchReceiverDetails(data);
  };

  function toPaise(inr: string): number {
    const n = Number(inr);
    if (Number.isNaN(n) || n <= 0) return 0;
    return Math.round(n * 100);
  }

  async function payViaUPI() {
    if (!receiver?.upiId) {
      Alert.alert("UPI", "Scan QR first");
      return;
    }
    if (!amount) {
      Alert.alert("UPI", "Enter amount");
      return;
    }

    const pa = encodeURIComponent(receiver.upiId);
    const pn = encodeURIComponent(receiver.name || "Receiver");
    const am = encodeURIComponent(amount);
    const cu = "INR";
    const tn = encodeURIComponent(`Payment to ${receiver.name}`);

    const url = `upi://pay?pa=${pa}&pn=${pn}&am=${am}&cu=${cu}&tn=${tn}`;
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert("UPI", "No UPI app found");
      return;
    }
    await Linking.openURL(url);
  }

  async function markAsPaid() {
    if (!receiverId) return Alert.alert("Record", "Scan a QR first");
    const paise = toPaise(amount);
    if (paise <= 0) return Alert.alert("Record", "Invalid amount");
    if (!upiTxnId.trim()) return Alert.alert("Record", "Enter UPI Txn ID");
    if (!contract || !ethersProvider) return;

    try {
      setLoading(true);
      const signer = await ethersProvider.getSigner();
      const withSigner = contract.connect(signer);
	  const tx = await (withSigner as any).recordUPIPayment(receiverId, paise, upiTxnId.trim());
      await tx.wait();
      Alert.alert("Success", "Payment recorded on-chain");
      setUpiTxnId("");
      fetchHistory();
    } catch (err: any) {
      Alert.alert("Record", err?.reason ?? err?.message ?? "Failed to record");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isConnected) fetchHistory();
  }, [isConnected]);

  // ---- UI ----
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Transactions</Text>

      <View style={styles.row}>
        <TouchableOpacity style={styles.button} onPress={connectWallet}>
          <Text style={styles.buttonText}>
            {isConnected ? "Wallet Connected" : "Connect Wallet"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondary]}
          onPress={() => {
            if (!permission?.granted) requestPermission();
            setScanning(true);
          }}
        >
          <Text style={styles.buttonText}>Scan QR</Text>
        </TouchableOpacity>
      </View>

      {scanning && (
        <View style={styles.scannerWrap}>
          <CameraView
            style={{ width: "100%", height: 280 }}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={onScan}
          />
          <TouchableOpacity
            style={[styles.button, styles.secondary, { marginTop: 8 }]}
            onPress={() => setScanning(false)}
          >
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </View>
      )}

      {receiver?.exists && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Receiver</Text>
          <Text style={styles.kv}>
            <Text style={styles.k}>Name:</Text> {receiver.name}
          </Text>
          <Text style={styles.kv}>
            <Text style={styles.k}>UPI:</Text> {receiver.upiId}
          </Text>
          <Text style={styles.kv}>
            <Text style={styles.k}>ID:</Text> {receiverId}
          </Text>

          <TextInput
            placeholder="Amount (INR)"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
            style={styles.input}
          />

          <TouchableOpacity style={styles.button} onPress={payViaUPI}>
            <Text style={styles.buttonText}>Pay via UPI</Text>
          </TouchableOpacity>

          <TextInput
            placeholder="UPI Transaction ID"
            value={upiTxnId}
            onChangeText={setUpiTxnId}
            style={styles.input}
          />

          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.6 }]}
            onPress={markAsPaid}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Recording..." : "Mark as Paid"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={[styles.title, { marginTop: 16 }]}>History</Text>
      {!history.length ? (
        <Text>No transactions yet</Text>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={{ paddingBottom: 40 }}
          renderItem={({ item }) => {
            const amt = Number(item.amountPaise) / 100;
            const ts = new Date(Number(item.timestamp) * 1000).toLocaleString();
            return (
              <View style={styles.historyItem}>
                <Text style={styles.historyTitle}>₹{amt.toFixed(2)}</Text>
                <Text style={styles.kv}>
                  <Text style={styles.k}>To:</Text> {item.to}
                </Text>
                <Text style={styles.kv}>
                  <Text style={styles.k}>Txn ID:</Text> {item.upiTxnId}
                </Text>
                <Text style={styles.kv}>
                  <Text style={styles.k}>Date:</Text> {ts}
                </Text>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

// ---- STYLES ----
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 8 },
  row: { flexDirection: "row", gap: 8, marginVertical: 8 },
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  secondary: { backgroundColor: "#5856D6" },
  buttonText: { color: "#fff", fontWeight: "600" },
  scannerWrap: { width: "100%", alignItems: "center", marginVertical: 8 },
  card: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", marginBottom: 6 },
  kv: { fontSize: 14, marginTop: 2 },
  k: { fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginVertical: 8,
  },
  historyItem: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  historyTitle: { fontSize: 15, fontWeight: "700", marginBottom: 4 },
});
