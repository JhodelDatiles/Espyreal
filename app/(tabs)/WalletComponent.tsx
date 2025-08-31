import React, { useMemo } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const WalletComponent = ({ 
  wallet, 
  onClearWallet, 
  visible, 
  onClose, 
  currencyValues 
}) => {
  // Calculate wallet statistics
  const walletStats = useMemo(() => {
    const total = wallet.reduce((sum, item) => sum + item.value, 0);
    const billCounts = wallet.reduce((counts, item) => {
      counts[item.denomination] = (counts[item.denomination] || 0) + 1;
      return counts;
    }, {});
    
    return {
      total,
      count: wallet.length,
      billCounts,
    };
  }, [wallet, currencyValues]);

  // Sort wallet items by newest first for consistency
  const sortedWallet = useMemo(() => {
    return [...wallet].sort((a, b) => b.timestamp - a.timestamp);
  }, [wallet]);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getBillInfo = (denomination) => {
    // Support both peso and dollar bills
    const billInfo = {
      // Philippine Peso Bills
      '20 pesos': { color: '#FF6B35', symbol: '₱', label: 'Twenty Pesos' },
      '50 pesos': { color: '#FF3030', symbol: '₱', label: 'Fifty Pesos' },
      '100 pesos': { color: '#9C27B0', symbol: '₱', label: 'One Hundred Pesos' },
      '500 pesos': { color: '#FFD700', symbol: '₱', label: 'Five Hundred Pesos' },
      '1000 pesos': { color: '#2196F3', symbol: '₱', label: 'One Thousand Pesos' },
      
      // US Dollar Bills
      '1 dollar': { color: '#4CAF50', symbol: '$', label: 'One Dollar' },
      '5 dollars': { color: '#FF9800', symbol: '$', label: 'Five Dollars' },
      '10 dollars': { color: '#795548', symbol: '$', label: 'Ten Dollars' },
      '20 dollars': { color: '#9C27B0', symbol: '$', label: 'Twenty Dollars' },
      '50 dollars': { color: '#E91E63', symbol: '$', label: 'Fifty Dollars' },
      '100 dollars': { color: '#4CAF50', symbol: '$', label: 'One Hundred Dollars' },
    };
    return billInfo[denomination] || { color: '#9E9E9E', symbol: '¤', label: denomination };
  };

  const handleClearWallet = () => {
    Alert.alert(
      'Clear Wallet',
      'Are you sure you want to remove all bills from your wallet?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: onClearWallet
        }
      ]
    );
  };

  const handleRemoveItem = (itemId, denomination) => {
    Alert.alert(
      'Remove Bill',
      `Remove ${getBillInfo(denomination).label} from your wallet?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            // This would need to be implemented in the parent component
            console.log('Remove item:', itemId);
          }
        }
      ]
    );
  };

  const renderWalletItem = ({ item }) => {
    const billInfo = getBillInfo(item.denomination);
    
    return (
      <View style={styles.walletItem}>
        <View style={styles.billInfo}>
          <Text style={styles.billDenomination}>
            {billInfo.label}
          </Text>
          <Text style={styles.billTime}>
            Added at {formatTime(item.timestamp)}
          </Text>
          <Text style={[styles.billValue, { color: billInfo.color }]}>
            {billInfo.symbol}{item.value}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveItem(item.id, item.denomination)}
          accessibilityLabel={`Remove ${billInfo.label}`}
          accessibilityHint="Double tap to remove this bill from your wallet"
        >
          <Text style={styles.removeButtonText}>Remove</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      accessibilityViewIsModal={true}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={onClose} 
            style={styles.closeButton}
            accessibilityLabel="Close wallet"
            accessibilityHint="Double tap to close the wallet view"
          >
            <Text style={styles.closeButtonText}>◄</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Wallet</Text>
          <TouchableOpacity 
            onPress={handleClearWallet} 
            style={styles.clearButton}
            accessibilityLabel="Clear all bills"
            accessibilityHint="Double tap to remove all bills from your wallet"
          >
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        </View>

        {/* Wallet Summary */}
        <View style={styles.summaryContainer}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalAmount}>
            {walletStats.total.toLocaleString()} 
          </Text>
          <Text style={styles.billCount}>
            {walletStats.count} {walletStats.count === 1 ? 'bill' : 'bills'} in wallet
          </Text>
        </View>

        {/* Wallet Items List */}
        <View style={styles.itemsContainer}>
          <Text style={styles.sectionTitle}>Your Bills</Text>
          {wallet.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No bills in wallet</Text>
              <Text style={styles.emptyStateSubtext}>
                Start scanning to add peso or dollar bills to your wallet
              </Text>
            </View>
          ) : (
            <FlatList
              data={sortedWallet}
              renderItem={renderWalletItem}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
              accessibilityLabel="List of bills in your wallet"
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 2,
    borderBottomColor: '#e0e0e0',
  },
 closeButton: {
  paddingHorizontal: 20,
  paddingVertical: 12,
  borderRadius: 8,
  backgroundColor: "#fcebe8", // must be a valid color string
  shadowColor: "rgba(18,214,0,0.75)",
  shadowOffset: { width: 1, height: 0 },
  shadowOpacity: 1,
  shadowRadius: 10,
  elevation: 5, // required for Android shadow
},
  closeButtonText: {
    fontSize: 16,
    color: 'black',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  clearButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#dc3545',
  },
  clearButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  summaryContainer: {
    backgroundColor: '#f8f9fa',
    margin: 20,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  totalLabel: {
    fontSize: 18,
    color: '#495057',
    marginBottom: 8,
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 70,
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: 8,
  },
  billCount: {
    fontSize: 16,
    color: '#6c757d',
    fontWeight: '500',
  },
  itemsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 20,
    color: '#6c757d',
    marginBottom: 12,
    fontWeight: '600',
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: '#868e96',
    textAlign: 'center',
    lineHeight: 24,
  },
  listContainer: {
    paddingBottom: 20,
  },
  walletItem: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  billInfo: {
    marginBottom: 16,
  },
  billDenomination: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  billTime: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 12,
  },
  billValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  removeButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#dc3545',
    alignSelf: 'flex-start',
  },
  removeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default WalletComponent;