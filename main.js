import axios from 'axios';
import { createChart } from './charthelper';
import { addOrderToWallet, changeLocalCurrency, getLocalCurrency, getLocalWallet, removeOrderFromWallet } from './storage';
import Swal from 'sweetalert2';

const ASSETS_URL = 'https://api.coincap.io/v2/assets';
const app = document.getElementById('app');
const coin = document.getElementById('coin-data');
const filterInput = document.getElementById('filter');
const currency = document.getElementById('currency');
const rateLabel = document.createElement('label');
const rateInput = document.createElement('input');
const fiatLabel = document.createElement('label');
const fiatInput = document.createElement('input');

let currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});
export let numberFormatter = new Intl.NumberFormat('en-US', { maximumSignificantDigits: 10 });
let appData = [];
let appFilteredData = [];
let coinInfo = {};
let coinData = [];
let ratesData = [];
let localCurrency = getLocalCurrency();
let localWallet = getLocalWallet();
let filterValue = '';
currency.innerText = localCurrency.currency;

const getData = () => {
  axios
    .get(ASSETS_URL)
    .then(res => (appData = res.data.data))
    .then(() => renderApi());
};

const getCoinData = (id, interval, info) => {
  axios
    .get(ASSETS_URL + `/${id}/history?interval=${interval}`)
    .then(res => (coinData = res.data.data))
    .then(() => renderApiCoin(info))
    .then(() => (coinInfo = info));
};

const getRatesData = () => {
  axios
    .get('https://api.coincap.io/v2/rates')
    .then(res => (ratesData = res.data.data.filter(rate => rate.type === 'fiat')))
    .then(() => generateCurrencySelect());
};

const generateCurrencySelect = () => {
  ratesData.sort((a, b) => {
    if (a.symbol < b.symbol) {
      return -1;
    }
    if (a.symbol > b.symbol) {
      return 1;
    }

    return 0;
  });

  let options = {};
  ratesData.map(rate => {
    options[`${rate.symbol}`] = `${rate.symbol} ($${parseFloat(rate.rateUsd).toFixed(6)} USD)`;
  });

  currency.addEventListener('click', async () => {
    const { value } = await Swal.fire({
      input: 'select',
      inputOptions: options,
      background: '#1c1c1c',
      color: '#fff',
      width: 'fit-content',
      confirmButtonText: 'SELECT',
      customClass: {
        popup: 'swal-container',
        confirmButton: 'swal-btn',
        input: 'swal-input',
      },
    });
    if (value) {
      let rate = ratesData.findIndex(rate => rate.symbol === value);
      let rateData = ratesData[rate];
      let newCurrency = { currency: rateData.symbol, rate: rateData.rateUsd };
      changeLocalCurrency(newCurrency);
      localCurrency = newCurrency;
      currency.innerText = value;
      renderApi();
      if (coinData.length > 0) {
        renderApiCoin(coinInfo);
      }
    }
  });
};

const timeframes = [
  { interval: 'm5', name: '5 min' },
  { interval: 'm30', name: '30 min' },
  { interval: 'h1', name: '1 hour' },
  { interval: 'h6', name: '6 hours' },
  { interval: 'h12', name: '12 hours' },
  { interval: 'd1', name: '1 day' },
];

const renderApiCoin = async info => {
  coin.innerHTML = `
  <div id="order-wrapper">
    <div>
      <div id="info"></div>
      <div id="chart-btns"></div>
      <div id="chart"></div>
    </div>
    <div id="order">
    </div>
  </div>`;

  const order = document.getElementById('order');

  await createChart(coinData, localCurrency);

  const infoContainer = document.getElementById('info');
  infoContainer.innerHTML = `
  <img src="https://assets.coincap.io/assets/icons/${info.symbol}@2x.png" alt="">
  <h2>${info.name}</h2>`;

  const buttonsContainer = document.getElementById('chart-btns');

  timeframes.map(button => {
    const child = document.createElement('button');
    child.innerText = button.name;
    child.addEventListener('click', () => getCoinData(info.id, button.interval, info));
    buttonsContainer.appendChild(child);
  });

  rateLabel.className = 'orderinput';
  rateLabel.innerText = info.symbol.toUpperCase();

  rateInput.value = 1;

  fiatLabel.className = 'orderinput';
  fiatLabel.innerText = localCurrency.currency.toUpperCase();
  fiatInput.value = parseFloat(info.price / localCurrency.rate).toFixed(8);

  rateInput.addEventListener('keyup', e => changeCrypto(e, localCurrency.rate, info.price));
  fiatInput.addEventListener('keyup', e => changeFiat(e, localCurrency.rate, info.price));

  const swapLabel = document.createElement('p');
  swapLabel.className = 'orderswap';
  swapLabel.innerText = 'SWAP';

  const orderBtn = document.createElement('button');
  orderBtn.innerText = 'GENERATE ORDER';
  orderBtn.addEventListener('click', () => {
    let newOrder = {
      id: fiatInput.value + rateInput.value,
      fiat: { amount: fiatInput.value, currency: localCurrency.currency },
      crypto: { amount: rateInput.value, currency: info.symbol.toUpperCase() },
    };
    addOrderToWallet(newOrder);
    localWallet = getLocalWallet();
    createOrderContainer();
  });

  rateLabel.appendChild(rateInput);
  fiatLabel.appendChild(fiatInput);
  order.appendChild(rateLabel);
  order.appendChild(swapLabel);
  order.appendChild(fiatLabel);
  order.appendChild(orderBtn);

  coin.animate([{ gridTemplateRows: '0fr' }, { gridTemplateRows: '1fr' }], { duration: 100 });
  coin.style.padding = '20px';

  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const changeCrypto = (e, fiat, crypto) => {
  fiatInput.value = e.target.value * parseFloat(crypto / fiat);
};

const changeFiat = (e, fiat, crypto) => {
  rateInput.value = e.target.value / parseFloat(crypto / fiat);
};

const renderApi = () => {
  app.innerHTML = '';
  appFilteredData = appData.filter(coin => {
    return coin.name.toLowerCase().includes(filterValue.toLowerCase());
  });
  if ((filterValue !== '') & (appFilteredData.length === 0)) {
    app.innerHTML = `<h3 class="no-results">We couldn't find that coin!</h3>`;
  } else {
    appFilteredData.map(coin => {
      let changeDirection = coin.changePercent24Hr.includes('-');
      let infoBtn = document.createElement('button');
      let coinInformation = { name: coin.name, symbol: coin.symbol.toLowerCase(), id: coin.id, price: coin.priceUsd };
      infoBtn.innerText = 'Details';
      infoBtn.addEventListener('click', () => getCoinData(coin.id, 'm5', coinInformation));
      let card = document.createElement('div');
      card.className = 'coin';
      card.innerHTML = `
        <div class="coin__info">
          <img src="https://assets.coincap.io/assets/icons/${coin.symbol.toLowerCase()}@2x.png" alt="">
          <h4>${coin.name}</h4>
        </div>
        <div class="coin__price">
          <p>PRICE (${localCurrency.currency})</p>
          <h6>$${numberFormatter.format(parseFloat(coin.priceUsd / localCurrency.rate).toFixed(8))}</h6>
        </div>
        <div>
          <p>24HS CHANGE%</p>
          <h6 class="coin__change${changeDirection ? '__minus' : '__plus'}">${parseFloat(coin.changePercent24Hr).toFixed(3)}%</h6>
        </div>
        <div>
          <p>MARKETCAP (USD)</p>
          <h6 class="coin__marketcap">${currencyFormatter.format(parseFloat(coin.marketCapUsd).toFixed(2))}</h6>
        </div>
        <div>
          <p>SUPPLY</p>
          <h6 class="coin__supply">${numberFormatter.format(parseInt(coin.supply).toFixed(0))} ${coin.symbol}</h6>
        </div>`;
      card.appendChild(infoBtn);
      app.appendChild(card);
      return card;
    });
  }
};

const changeFilter = e => {
  filterValue = e.target.value;
  renderApi();
};

filterInput.addEventListener('keyup', e => changeFilter(e));

const createOrderContainer = () => {
  let orderHTML = document.createElement('div');
  orderHTML.className = 'order-wrapper';
  if (localWallet.length > 0) {
    localWallet.map(order => {
      let orderToDisplay = document.createElement('div');
      orderToDisplay.className = 'order';
      orderToDisplay.innerHTML = `
        <div>
          <p>${order.crypto.amount}</p>
          <p>${order.crypto.currency}</p>
        </div>
        <p>➔</p>
        <div>
          <p>$${order.fiat.amount}</p>
          <p>${order.fiat.currency}</p>
        </div>`;
      let button = document.createElement('button');
      button.innerText = '✖';
      button.addEventListener('click', () => {
        removeOrderFromWallet(order.id);
        localWallet = getLocalWallet();
        createOrderContainer();
        Swal.close();
      });
      orderToDisplay.appendChild(button);
      orderHTML.appendChild(orderToDisplay);
    });
  } else {
    orderHTML.innerText = "You don't have orders yet";
  }

  document.getElementById('wallet').addEventListener('click', () =>
    Swal.fire({
      html: orderHTML,
      background: '#1c1c1c',
      color: '#fff',
      width: 'fit-content',
      showConfirmButton: false,
      showCloseButton: true,
      customClass: {
        popup: 'swal-order-container',
        confirmButton: 'swal-btn',
        input: 'swal-input',
      },
    })
  );
};

const initApp = () => {
  getData();
  getRatesData();
  createOrderContainer();
  setInterval(() => {
    getData();
  }, 50000);
};

initApp();
