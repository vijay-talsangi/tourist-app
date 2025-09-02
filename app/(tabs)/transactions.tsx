import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { ethers } from 'ethers';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import 'react-native-get-random-values'; // Must be imported before ethers

const { width, height } = Dimensions.get('window');

// UPI Registry Contract ABI (simplified for key functions)
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

// Contract address - replace with your deployed contract address
const CONTRACT_ADDRESS = "0x327FBD979a30F12cC338C66261f861c4E96Db125";

interface Payment {
  from: string;
  to: string;
  receiverId: string;
  amountPaise: number;
  upiTxnId: string;
  timestamp: number;
  type: 'sent' | 'received';
}

interface Receiver {
  upiId: string;
  name: string;
  addedBy: string;
  createdAt: number;
  exists: boolean;
}

export default function TransactionsScreen() {
  const [wallet, setWallet] = useState<ethers.Wallet | null>(null);
  const [provider, setProvider] = useState<ethers.JsonRpcProvider | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [address, setAddress] = useState<string>('');
  const [balance, setBalance] = useState<string>('0');
  const [transactions, setTransactions] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modals
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showAddReceiver, setShowAddReceiver] = useState(false);
  const [showSearchUPI, setShowSearchUPI] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  
  // Form states
  const [newUpiId, setNewUpiId] = useState('');
  const [newReceiverName, setNewReceiverName] = useState('');
  const [searchUpiId, setSearchUpiId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [selectedReceiver, setSelectedReceiver] = useState<{ id: string; receiver: Receiver } | null>(null);
  
  // Camera permissions
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  
  const scrollY = new Animated.Value(0);

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [180, 120],
    extrapolate: 'clamp',
  });

  // Initialize wallet and contract
  useEffect(() => {
    initializeWallet();
  }, []);

  const initializeWallet = async () => {
    try {
      setLoading(true);
      
      // Initialize provider (replace with your RPC URL)
      const rpcProvider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/aa8536212b914963bf464b1a4ca4ecfb');
      setProvider(rpcProvider);
      
      // Create or load wallet (in production, use secure storage)
      // Generate secure random private key
      const randomBytes = new Uint8Array(32);
      crypto.getRandomValues(randomBytes);
      const privateKey = ethers.hexlify(randomBytes);
      
      const walletInstance = new ethers.Wallet(privateKey, rpcProvider);
      setWallet(walletInstance);
      setAddress(walletInstance.address);
      
      // Get balance
      const balance = await rpcProvider.getBalance(walletInstance.address);
      setBalance(ethers.formatEther(balance));
      
      // Initialize contract
      const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, UPI_REGISTRY_ABI, walletInstance);
      setContract(contractInstance);
      
      // Load transactions
      await loadTransactions(contractInstance);
    } catch (error) {
      console.error('Failed to initialize wallet:', error);
      Alert.alert('Error', 'Failed to initialize wallet connection');
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async (contractInstance?: ethers.Contract) => {
    if (!contractInstance && !contract) return;
    
    try {
      const activeContract = contractInstance || contract;
      const payments = await activeContract!.getMyPayments();
      
      const formattedTransactions: Payment[] = payments.map((payment: any) => ({
        from: payment.from,
        to: payment.to,
        receiverId: payment.receiverId,
        amountPaise: Number(payment.amountPaise),
        upiTxnId: payment.upiTxnId,
        timestamp: Number(payment.timestamp),
        type: payment.from.toLowerCase() === address.toLowerCase() ? 'sent' : 'received'
      }));
      
      setTransactions(formattedTransactions.reverse()); // Latest first
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  // Camera permission and QR scanning
  const handleCameraPermission = async () => {
    if (!permission) {
      // Permissions are loading
      return;
    }

    if (!permission.granted) {
      // Request permission
      const result = await requestPermission();
      if (result.granted) {
        setShowQRScanner(true);
      } else {
        Alert.alert('Permission Required', 'Camera access is needed to scan QR codes');
      }
    } else {
      setShowQRScanner(true);
    }
  };

  const handleBarcodeScanned = async (scanningResult: any) => {
    if (scanned) return;
    
    setScanned(true);
    setShowQRScanner(false);
    
    try {
      // Assume QR contains receiverId (bytes32)
      const receiverId = scanningResult.data;
      const receiverData = await contract!.getReceiver(receiverId);
      
      if (receiverData.exists) {
        setSelectedReceiver({
          id: receiverId,
          receiver: {
            upiId: receiverData.upiId,
            name: receiverData.name,
            addedBy: receiverData.addedBy,
            createdAt: Number(receiverData.createdAt),
            exists: receiverData.exists
          }
        });
        setShowPayment(true);
      } else {
        Alert.alert('Error', 'Invalid QR code or receiver not found');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to process QR code');
    }
    
    // Reset scanned state after a delay
    setTimeout(() => setScanned(false), 2000);
  };

  const addReceiver = async () => {
    if (!contract || !newUpiId || !newReceiverName) return;
    
    try {
      setLoading(true);
      const tx = await contract.addReceiver(newUpiId, newReceiverName);
      await tx.wait();
      
      Alert.alert('Success', 'Receiver added successfully!');
      setNewUpiId('');
      setNewReceiverName('');
      setShowAddReceiver(false);
    } catch (error) {
      console.error('Failed to add receiver:', error);
      Alert.alert('Error', 'Failed to add receiver');
    } finally {
      setLoading(false);
    }
  };

  const searchUPI = async () => {
    if (!contract || !searchUpiId) return;
    
    try {
      setLoading(true);
      const result = await contract.findReceiverIdByUPI(searchUpiId);
      
      if (result.exists) {
        const receiverData = await contract.getReceiver(result.receiverId);
        setSelectedReceiver({
          id: result.receiverId,
          receiver: {
            upiId: receiverData.upiId,
            name: receiverData.name,
            addedBy: receiverData.addedBy,
            createdAt: Number(receiverData.createdAt),
            exists: receiverData.exists
          }
        });
        setShowSearchUPI(false);
        setShowPayment(true);
      } else {
        Alert.alert('Not Found', 'No receiver found with this UPI ID');
      }
    } catch (error) {
      console.error('Failed to search UPI:', error);
      Alert.alert('Error', 'Failed to search UPI ID');
    } finally {
      setLoading(false);
    }
  };

  const recordPayment = async () => {
    if (!contract || !selectedReceiver || !paymentAmount) return;
    
    try {
      setLoading(true);
      const amountPaise = Math.round(parseFloat(paymentAmount) * 100);
      const mockUpiTxnId = `UPI${Date.now()}`; // In real app, get from UPI gateway
      
      const tx = await contract.recordUPIPayment(
        selectedReceiver.id,
        amountPaise,
        mockUpiTxnId
      );
      await tx.wait();
      
      Alert.alert('Success', 'Payment recorded successfully!');
      setPaymentAmount('');
      setPaymentNote('');
      setSelectedReceiver(null);
      setShowPayment(false);
      await loadTransactions();
    } catch (error) {
      console.error('Failed to record payment:', error);
      Alert.alert('Error', 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amountPaise: number) => {
    return `₹${(amountPaise / 100).toFixed(2)}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderTransaction = ({ item }: { item: Payment }) => (
    <View style={styles.transactionCard}>
      <View style={styles.transactionIcon}>
        <Ionicons 
          name={item.type === 'sent' ? 'arrow-up' : 'arrow-down'} 
          size={20} 
          color={item.type === 'sent' ? '#EF4444' : '#10B981'} 
        />
      </View>
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionTitle}>
          {item.type === 'sent' ? 'Sent to' : 'Received from'}
        </Text>
        <Text style={styles.transactionSubtitle}>
          {item.upiTxnId}
        </Text>
        <Text style={styles.transactionDate}>
          {formatDate(item.timestamp)}
        </Text>
      </View>
      <View style={styles.transactionAmount}>
        <Text style={[
          styles.amount,
          { color: item.type === 'sent' ? '#EF4444' : '#10B981' }
        ]}>
          {item.type === 'sent' ? '-' : '+'}{formatAmount(item.amountPaise)}
        </Text>
      </View>
    </View>
  );

  if (loading && !wallet) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Connecting to wallet...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        <LinearGradient
          colors={['#6366F1', '#8B5CF6']}
          style={styles.gradientHeader}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.greeting}>My Wallet</Text>
          <Text style={styles.balance}>₹{balance} ETH</Text>
          <Text style={styles.address} numberOfLines={1}>
            {address}
          </Text>
        </LinearGradient>
      </Animated.View>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleCameraPermission}
        >
          <LinearGradient
            colors={['#6366F1', '#8B5CF6']}
            style={styles.actionGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialIcons name="qr-code-scanner" size={24} color="#FFF" />
          </LinearGradient>
          <Text style={styles.actionText}>Scan QR</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setShowSearchUPI(true)}
        >
          <LinearGradient
            colors={['#10B981', '#059669']}
            style={styles.actionGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="search" size={24} color="#FFF" />
          </LinearGradient>
          <Text style={styles.actionText}>Search UPI</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setShowAddReceiver(true)}
        >
          <LinearGradient
            colors={['#F59E0B', '#D97706']}
            style={styles.actionGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="add" size={24} color="#FFF" />
          </LinearGradient>
          <Text style={styles.actionText}>Add Receiver</Text>
        </TouchableOpacity>
      </View>

      {/* Transactions List */}
      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={(item, index) => `${item.upiTxnId}-${index}`}
        style={styles.transactionsList}
        contentContainerStyle={styles.transactionsContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialIcons name="account-balance-wallet" size={64} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Transactions Yet</Text>
            <Text style={styles.emptySubtitle}>Your transaction history will appear here</Text>
          </View>
        }
      />

      {/* QR Scanner Modal */}
      <Modal visible={showQRScanner} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.scannerHeader}>
            <TouchableOpacity onPress={() => {
              setShowQRScanner(false);
              setScanned(false);
            }}>
              <Ionicons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.scannerTitle}>Scan QR Code</Text>
            <View style={{ width: 24 }} />
          </View>
          {permission?.granted ? (
            <CameraView
              style={StyleSheet.absoluteFillObject}
              facing="back"
              onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
            >
              <View style={styles.scannerOverlay}>
                <View style={styles.scannerFrame} />
              </View>
            </CameraView>
          ) : (
            <View style={styles.permissionContainer}>
              <Text style={styles.permissionText}>Camera permission required</Text>
              <TouchableOpacity onPress={requestPermission} style={styles.permissionButton}>
                <Text style={styles.permissionButtonText}>Grant Permission</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      {/* Add Receiver Modal */}
      <Modal visible={showAddReceiver} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Receiver</Text>
            <TextInput
              style={styles.input}
              placeholder="UPI ID (e.g., user@upi)"
              value={newUpiId}
              onChangeText={setNewUpiId}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Display Name"
              value={newReceiverName}
              onChangeText={setNewReceiverName}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddReceiver(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={addReceiver}
                disabled={loading}
              >
                <Text style={styles.confirmButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Search UPI Modal */}
      <Modal visible={showSearchUPI} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Search UPI ID</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter UPI ID"
              value={searchUpiId}
              onChangeText={setSearchUpiId}
              autoCapitalize="none"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowSearchUPI(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={searchUPI}
                disabled={loading}
              >
                <Text style={styles.confirmButtonText}>Search</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Payment Modal */}
      <Modal visible={showPayment} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Send Payment</Text>
            {selectedReceiver && (
              <View style={styles.receiverInfo}>
                <Text style={styles.receiverName}>{selectedReceiver.receiver.name}</Text>
                <Text style={styles.receiverUPI}>{selectedReceiver.receiver.upiId}</Text>
              </View>
            )}
            <TextInput
              style={styles.input}
              placeholder="Amount (₹)"
              value={paymentAmount}
              onChangeText={setPaymentAmount}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="Note (optional)"
              value={paymentNote}
              onChangeText={setPaymentNote}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowPayment(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={recordPayment}
                disabled={loading}
              >
                <Text style={styles.confirmButtonText}>Pay</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    overflow: 'hidden',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  gradientHeader: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 24,
    justifyContent: 'flex-end',
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  balance: {
    fontSize: 24,
    fontWeight: '600',
    color: '#E0E7FF',
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    color: '#C7D2FE',
    fontFamily: 'monospace',
  },
  actionContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 20,
    justifyContent: 'space-between',
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 8,
  },
  actionGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
    textAlign: 'center',
  },
  transactionsList: {
    flex: 1,
  },
  transactionsContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  transactionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  transactionSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#94A3B8',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  scannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  scannerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  scannerOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: '#FFF',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  permissionText: {
    fontSize: 16,
    color: '#FFF',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  receiverInfo: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  receiverName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  receiverUPI: {
    fontSize: 14,
    color: '#64748B',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 6,
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
  },
  confirmButton: {
    backgroundColor: '#6366F1',
  },
  cancelButtonText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  confirmButtonText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});