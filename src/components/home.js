import React, { useState, useEffect, useRef } from 'react';
import TradingViewWidget from './TradingViewWidget';
import logo from './logo.svg';
import { Route, Routes, useRoutes } from 'react-router';
import { BrowserRouter } from 'react-router-dom';
import "./home.css";
import Positions from './positionTemplate';

function Home() {
  const [isPopupOpen, setPopupOpen] = useState(false);
  const [orderType, setOrderType] = useState(null);
  const popupRef = useRef(null);
  const [orderData, setOrdereData] = useState(null);
  const [entryPrice, setEntryPrice] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [marketOrLimit, setMarketOrLimit] = useState("limit");
  const [btcusdt, setBtcusdt] = useState();
  const [marketOrders, setMarketOrders] = useState([]);
  const [marginUsed, setMarginUsed] = useState(0);

  useEffect(() => {
    // Create a new WebSocket instance
    const socket = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@trade'); // Change the URL to match your WebSocket server

    // Event listener for WebSocket connection open
    socket.onopen = () => {
      console.log('WebSocket connected');
    };

    // Event listener for WebSocket incoming messages
    socket.onmessage = (event) => {
      setBtcusdt(JSON.parse(event.data));

    };

    // Event listener for WebSocket connection close
    socket.onclose = () => {
      console.log('WebSocket disconnected');
    };

    // Cleanup function to close the WebSocket connection when the component unmounts
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, []);

  useEffect(() => {
    if (btcusdt !== null) {
      let margin = 0;
      let livepnl = 0;
      for (let i = 0; i < marketOrders.length; i++) {
        margin += parseFloat(marketOrders[i]["entry_price"]);

        if (marketOrders[i]["orderType"] == "buy") {
          livepnl += btcusdt["p"] - parseFloat(marketOrders[i]["entry_price"]);
        }
        else {
          livepnl += parseFloat(marketOrders[i]["entry_price"]) - btcusdt["p"];
        }
      }

      if (livepnl >= 0) {
        document.getElementById("currentPNL").style.color = "blue";
      }
      else {
        document.getElementById("currentPNL").style.color = "red";
      }

      document.getElementById("currentPNL").innerHTML = livepnl.toFixed(2);
      document.getElementById("margin").innerHTML = 1000000 - margin.toFixed(2);
      document.getElementById("balance").innerHTML = 1000000 - livepnl.toFixed(2);
    }
  }, [btcusdt]);


  function handleEventData(event) {
    setBtcusdt(JSON.parse(event.data));
  }

  useEffect(() => {

    function handleClickOutside(event) {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setPopupOpen(false);
      }

      if (marketOrLimit == "market") {
        hideshowdiv(1);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [popupRef]);

  useEffect(() => {
    fetch('http://localhost:4000/getOrders', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: {
        'Content-type': 'application/json; charset=UTF-8',
      },
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        var tempMarket = [];
        for (let key in data["market"]) {
          tempMarket.push(data["market"][key]);
        }
        setMarketOrders(tempMarket);
      })
      .catch(error => {
        console.error('Fetch error:', error);
      });
  }, []);

  function hideshowdiv(val) {
    if (val === 1) {
      document.getElementById("div").style.display = 'none';
    }
    if (val === 2) {
      document.getElementById("div").style.display = 'block';
    }
  }

  const handleMarketOrLimit = (e) => {
    setMarketOrLimit(e.target.value);
  }

  const handlestopLoss = (e) => {
    setStopLoss(e.target.value);
  }

  const handleTakeProfit = (e) => {
    setTakeProfit(e.target.value);
  }

  const handlePrice = (e) => {
    setEntryPrice(e.target.value);
  }

  function openPopup() {
    setPopupOpen(true);
  }

  function closePopup() {
    setPopupOpen(false);
  }
  var sellButton = document.getElementById("sellButton");
  var buyButton = document.getElementById("buyButton");

  function handleBuy() {
    setOrderType('buy');
    buyButton.style.backgroundColor = "green";
    sellButton.style.backgroundColor = "blue";
  }

  function handleSell() {
    setOrderType('sell');

    buyButton.style.backgroundColor = "blue";
    sellButton.style.backgroundColor = "red";
  }

  function handleOrder() {

    let order = {};

    if (marketOrLimit == "market") {
      order =
      {
        "symbol": "BTCUSDT",
        "marketOrLimit": marketOrLimit,
        "orderType": orderType,
        "entry_price": btcusdt["p"],
        "stop_loss": stopLoss,
        "take_profit": takeProfit,
      };
    }
    else {
      order =
      {
        "symbol": "BTCUSDT",
        "marketOrLimit": marketOrLimit,
        "orderType": orderType,
        "entry_price": entryPrice,
        "stop_loss": stopLoss,
        "take_profit": takeProfit,
      };
    }

    fetch('http://localhost:4000/newOrder', {
      method: 'POST',
      body: JSON.stringify(order),
      headers: {
        'Content-type': 'application/json; charset=UTF-8',
      },
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {

      })
      .catch(error => {
        console.error('Fetch error:', error);
      });

    window.location.reload()
  }

  return (
    <>

      <div id="parent">
        <div className="container1">
          <button className="settings-button">
            <img src={logo} alt="Logo" className="logo" />
          </button>
          <h1>Balance</h1>
          <p id='balance'>000000</p>
          <div className="row">
            <div className="column">
              <h4>Available Margin</h4>
              <p id='margin'>000000 $</p>
            </div>
            <div className="column">
              <h4>Current P&L</h4>
              <p id='currentPNL'>000000</p>
            </div>
          </div>
          <button type="button" className="button" onClick={openPopup}>Order</button>
          <div className={isPopupOpen ? "popup open-popup" : "popup"} ref={popupRef} id="popup">
            <div className="row">
              <button type="button" className="button1" id='buyButton' onClick={handleBuy}>Buy</button>
              <button type="button" className="button1" id='sellButton' onClick={handleSell}>Sell</button>
            </div>
            <div>.</div>
            <div className="radiobutton">
              <label className="radio-inline">
                <input type="radio" value="market" checked={marketOrLimit === "market"} onChange={handleMarketOrLimit} name="optradio" onClick={() => hideshowdiv(1)} />Market
                <span className="check"></span>
              </label>
              <label className="radio-inline">
                <input type="radio" value="limit" checked={marketOrLimit === "limit"} onChange={handleMarketOrLimit} name="optradio" onClick={() => hideshowdiv(2)} />Limit
                <span className="checkmark"></span>
              </label>
            </div>
            <div>.</div>
            <div>
              <label className="label1">Stop Loss</label>
              <input className="input1" onChange={handlestopLoss} type="number" name="fname" />
              <div>.</div>
              <label className="label1">Take Profit</label>
              <input className="input1" onChange={handleTakeProfit} type="number" name="lname" />
              <div>.</div>
              <div id="div">
                <label className="label1">Price</label>
                <input className="input2" id='priceInputBox' onChange={handlePrice} type="number" name="lname" />
              </div>
              <div>.</div>
            </div>
            <button type="button" className="button2" onClick={handleOrder}>{orderType ? `${orderType} Order` : 'Order'}</button>
          </div>
          {btcusdt && marketOrders.map((ord, index) => (
            <>
              <Positions orders={ord} currentPrice={btcusdt["p"]} />
            </>
          ))}
        </div>
        <div className="container2">
          <TradingViewWidget />
        </div>
      </div>

    </>
  );
}

export default Home;