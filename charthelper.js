import { numberFormatter } from './main';

google.charts.load('current', { packages: ['corechart'] });

export const createChart = async (coinData, currency) => {
  let formattedData = coinData.map(timeframe => {
    return [formatTime(timeframe.time), timeframe.priceUsd / currency.rate, createCustomTooltip(timeframe, currency)];
  });

  let data = new google.visualization.DataTable();
  data.addColumn('string', 'X');
  data.addColumn('number', 'Price');
  data.addColumn({ type: 'string', role: 'tooltip', p: { html: true } });
  data.addRows(formattedData);

  let chart = new google.visualization.AreaChart(document.getElementById('chart'));

  chart.draw(data, {
    width: 700,
    legend: 'none',
    fontName: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
    hAxis: { textPosition: 'none' },
    vAxis: { textStyle: { color: '#ffffff' } },
    tooltip: { isHtml: true },
    lineWidth: 3,
    curveType: 'function',
    backgroundColor: '#1c1c1c',
  });
};

const formatTime = timestamp => {
  let ms = new Date(timestamp * 1000);
  let date = new Date(timestamp);
  return `${date.toLocaleDateString('en-US')}\n${ms.toLocaleTimeString('en-US')}`;
};

const createCustomTooltip = (timeframe, currency) => {
  let ms = new Date(timeframe.time * 1000);
  let date = new Date(timeframe.time);
  return `<div class="tooltip">
        <p>${date.toLocaleDateString('en-US')}</p>
        <p>${ms.toLocaleTimeString('en-US')}</p>
        <p>${numberFormatter.format(timeframe.priceUsd / currency.rate)} ${currency.currency}</p>
      </div>`;
};
