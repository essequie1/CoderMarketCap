export function getLocalCurrency() {
  const localRate = { currency: 'USD', rate: 1 };
  let localCurrency = localStorage.getItem('cmc_currency');

  if (localCurrency === null) {
    localStorage.setItem('cmc_currency', JSON.stringify(localRate));
    return localRate;
  } else {
    return JSON.parse(localCurrency);
  }
}

export function changeLocalCurrency(currency) {
  localStorage.setItem('cmc_currency', JSON.stringify(currency));
}

export function getLocalWallet() {
  const placeholder = [];
  let localWallet = localStorage.getItem('cmc_wallet');

  if (localWallet === null) {
    localStorage.setItem('cmc_wallet', JSON.stringify(placeholder));
    return [];
  } else {
    return JSON.parse(localWallet);
  }
}

export function addOrderToWallet(order) {
  let localWallet = localStorage.getItem('cmc_wallet');
  let wallet = JSON.parse(localWallet);

  wallet.push(order);
  console.log(wallet);
  localStorage.setItem('cmc_wallet', JSON.stringify(wallet));
}

export function removeOrderFromWallet(orderID) {
  let localWallet = localStorage.getItem('cmc_wallet');
  let wallet = JSON.parse(localWallet);

  let newWallet = wallet.filter(order => order.id !== orderID);
  localStorage.setItem('cmc_wallet', JSON.stringify(newWallet));
}
