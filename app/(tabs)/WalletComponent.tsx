import React, { useMemo } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
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
  currencyValues,
  onRemoveItem,
  exchangeRate = 58, // default 1 USD = 58 PHP
}) => {
  // 🧩 Define getBillInfo BEFORE using it
  const getBillInfo = (denomination) => {
    const billInfo = {
      // 🪙 Old & New PHP Coins
      '25 CENTS NEW': {
        color: '#BDC3C7', symbol: '₱',
        label: 'New Twenty-Five Cents', image: require('../../assets/images/Img/NEWCOINS5.png'),
        type: 'coin',
      },
      '1 PESO NEW': {
        color: '#BDC3C7', symbol: '₱',
        label: 'New One Peso', image: require('../../assets/images/Img/NEWCOINS4.png'),
        type: 'coin',
      },
      '5 PESO NEW': {
        color: '#D4AF37', symbol: '₱',
        label: 'New Five Peso', image: require('../../assets/images/Img/NEWCOINS3.png'),
        type: 'coin',
      },
      '10 PESO NEW': {
        color: '#BFA25A', symbol: '₱',
        label: 'New Ten Peso', image: require('../../assets/images/Img/NEWCOINS2.png'),
        type: 'coin',
      },
      '20 PESO COIN': {
        color: '#E1B12C', symbol: '₱',
        label: 'New Twenty Peso Coin', image: require('../../assets/images/Img/NEWCOINS1.png'),
        type: 'coin',
      },
      '25 CENTS OLD': {
        color: '#BDC3C7', symbol: '₱',
        label: 'Old Twenty-Five Cents', image: require('../../assets/images/Img/OLDCOINS4.png'),
        type: 'coin',
      },
      '1 PESO COIN': {
        color: '#C0C0C0', symbol: '₱',
        label: 'Old One Peso', image: require('../../assets/images/Img/OLDCOINS3.png'),
        type: 'coin',
      },
      '5 PESO COIN': {
        color: '#E1B12C', symbol: '₱',
        label: 'Old Five Peso', image: require('../../assets/images/Img/OLDCOINS2.png'),
        type: 'coin',
      },
      '10 PESO COIN': {
        color: '#BFA25A', symbol: '₱',
        label: 'Old Ten Peso', image: require('../../assets/images/Img/OLDCOINS1.png'),
        type: 'coin',
      },

      // 💵 Old Peso Bills
      '20 PESO': {
        color: '#E58E26', symbol: '₱',
        label: 'Old Twenty Pesos', image: require('../../assets/images/Img/OLDPESOBILLS6.png'),
        type: 'bill',
      },
      '50 PESO': {
        color: '#C0392B', symbol: '₱',
        label: 'Old Fifty Pesos', image: require('../../assets/images/Img/OLDPESOBILLS5.png'),
        type: 'bill',
      },
      '100 PESO': {
        color: '#8E44AD', symbol: '₱',
        label: 'Old One Hundred Pesos', image: require('../../assets/images/Img/OLDPESOBILLS4.png'),
        type: 'bill',
      },
      '200 PESO': {
        color: '#27AE60', symbol: '₱',
        label: 'Old Two Hundred Pesos', image: require('../../assets/images/Img/OLDPESOBILLS3.png'),
        type: 'bill',
      },
      '500 PESO': {
        color: '#F4D03F', symbol: '₱',
        label: 'Old Five Hundred Pesos', image: require('../../assets/images/Img/OLDPESOBILLS2.png'),
        type: 'bill',
      },
      '1000 PESO': {
        color: '#2980B9', symbol: '₱',
        label: 'Old One Thousand Pesos', image: require('../../assets/images/Img/OLDPESOBILLS1.png'),
        type: 'bill',
      },

      // 🧾 New Peso Bills
      '50NEW PHP PESO': {
        color: '#D63031',
        symbol: '₱',
        label: 'New Fifty Pesos',image: require('../../assets/images/Img/NEWPHPBILLS4.png'),
        type: 'bill',
      },
      '100NEW PHP PESO': {
        color: '#6C5CE7', symbol: '₱',
        label: 'New One Hundred Pesos', image: require('../../assets/images/Img/NEWPHPBILLS3.png'),
        type: 'bill',
      },
      '500NEW PHP PESO': {
        color: '#F1C40F', symbol: '₱',
        label: 'New Five Hundred Pesos', image: require('../../assets/images/Img/NEWPHPBILLS2.png'),
        type: 'bill',
      },
      '1000NEW PHP PESO': {
        color: '#0984E3', symbol: '₱',
        label: 'New One Thousand Pesos', image: require('../../assets/images/Img/NEWPHPBILLS1.png'), type: 'bill',
      },

      // 💵 USD Bills
      '1 DOLLARS': { 
        color: '#4CAF50', symbol: '$', label: 'One Dollar', 
        image: require('../../assets/images/Img/USDBILLS6.png'), type: 'bill' },
      '5 DOLLARS': { 
        color: '#9C27B0', symbol: '$', label: 'Five Dollars', 
        image: require('../../assets/images/Img/USDBILLS5.png'), type: 'bill' },
      '10 DOLLARS': { 
        color: '#E67E22', symbol: '$', label: 'Ten Dollars', 
        image: require('../../assets/images/Img/USDBILLS4.png'), type: 'bill' },
      '20 DOLLARS': { 
        color: '#4CAF50', symbol: '$', label: 'Twenty Dollars', 
        image: require('../../assets/images/Img/USDBILLS3.png'), type: 'bill' },
      '50 DOLLARS': { 
        color: '#E91E63', symbol: '$', label: 'Fifty Dollars', 
        image: require('../../assets/images/Img/USDBILLS2.png'), type: 'bill' },
      '100 DOLLARS': { 
        color: '#2196F3', symbol: '$', label: 'One Hundred Dollars', 
        image: require('../../assets/images/Img/USDBILLS1.png'),type: 'bill' },
    };

    return billInfo[denomination] || { color: '#9E9E9E', symbol: '¤', label: denomination };
  };

  //Compute wallet stats
  const walletStats = useMemo(() => {
    const total = wallet.reduce((sum, item) => {
      let valueInPHP = item.value;

      if (item.denomination?.toLowerCase().includes('dollar')) {
        valueInPHP *= exchangeRate;
      }

      return sum + valueInPHP;
    }, 0);

    const billCount = wallet.filter(
      (item) => getBillInfo(item.denomination)?.type === 'bill'
    ).length;

    const coinCount = wallet.filter(
      (item) => getBillInfo(item.denomination)?.type === 'coin'
    ).length;

    return { total, billCount, coinCount };
  }, [wallet, exchangeRate]);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleClearWallet = () => {
    Alert.alert('Clear Wallet', 'Are you sure you want to remove all bills?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear All', style: 'destructive', onPress: onClearWallet },
    ]);
  };

  const handleRemoveItem = (item) => {
    const billInfo = getBillInfo(item.denomination);
    Alert.alert('Remove Bill', `Remove ${billInfo.label}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => onRemoveItem(item.id) },
    ]);
  };

  const renderWalletItem = ({ item }) => {
    const billInfo = getBillInfo(item.denomination);
    return (
      <View style={styles.walletItem}>
        <View style={styles.billInfo}>
          <Text style={styles.billDenomination}>{billInfo.label}</Text>
          <Text style={styles.billTime}>Added at {formatTime(item.timestamp)}</Text>
          <Text style={[styles.billValue, { color: billInfo.color }]}>
            {billInfo.symbol}
            {item.value}
          </Text>
          {billInfo.image && (
            <Image
              source={billInfo.image}
              style={billInfo.type === 'coin' ? styles.coinImage : styles.billImage}
            />
          )}
        </View>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveItem(item)}
        >
          <Text style={styles.removeButtonText}>Remove</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // 🧱 UI Layout
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Wallet</Text>
          <TouchableOpacity onPress={handleClearWallet} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>

        {/* Wallet Summary */}
        <View style={styles.summaryContainer}>
          <Text style={styles.totalLabel}>Total Amount:</Text>
          <Text style={styles.totalAmount} adjustsFontSizeToFit numberOfLines={1}>
            ₱{walletStats.total.toLocaleString()}
          </Text>
          <Text style={styles.billCount}>
            {walletStats.billCount} {walletStats.billCount === 1 ? 'bill' : 'bills'} and{' '}
            {walletStats.coinCount} {walletStats.coinCount === 1 ? 'coin' : 'coins'} in wallet
          </Text>
        </View>

        {/* Wallet Items */}
        <View style={styles.itemsContainer}>
          <Text style={styles.sectionTitle}>Your Wallet</Text>
          {wallet.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No bills in wallet</Text>
              <Text style={styles.emptyStateSubtext}>
                Start scanning to add peso or dollar bills
              </Text>
            </View>
          ) : (
            <FlatList
              data={[...wallet].sort((a, b) => b.timestamp - a.timestamp)}
              renderItem={renderWalletItem}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

//Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 2,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    backgroundColor: '#fcebe8',
    borderRadius: 8,
    padding: 10,
  },
  closeButtonText: { fontSize: 16, fontWeight: 'bold', color: 'black' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  clearButton: { backgroundColor: '#dc3545', borderRadius: 8, padding: 10 },
  clearButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  summaryContainer: {
    backgroundColor: '#f8f9fa',
    margin: 20,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  totalLabel: { fontSize: 18, color: '#495057', marginBottom: 8, fontWeight: '600' },
  totalAmount: { fontSize: 70, fontWeight: 'bold', color: '#28a745', marginBottom: 8 },
  billCount: { fontSize: 16, color: '#6c757d', fontWeight: '500' },
  itemsContainer: { margin: 5,flex: 1, paddingHorizontal: 0 },
  sectionTitle: { alignSelf: 'center',fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyStateText: { fontSize: 20, color: '#6c757d', marginBottom: 12, fontWeight: '600' },
  emptyStateSubtext: { fontSize: 16, color: '#868e96', textAlign: 'center', lineHeight: 24 },
  walletItem: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  billInfo: { display: 'flex', flexDirection: 'column', alignItems: 'center',marginBottom: 16 },
  billDenomination: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  billTime: { fontSize: 16, color: '#6c757d', marginBottom: 12 },
  billValue: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  billImage: {
    width: 140,
    height: 50,
    resizeMode: 'contain',
    alignSelf: 'center',
  },
  coinImage: {
    width: 60,
    height: 60,
    borderRadius: 30, // makes it circular
    resizeMode: 'contain',
    alignSelf: 'center',
    backgroundColor: '#f5f5f5', // optional backdrop
    marginVertical: 5,
  },
  removeButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#dc3545',
    width: 300,
    alignSelf: 'center',
  },
  removeButtonText: { alignSelf: 'center' ,color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default WalletComponent;
