document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  const dashboard = document.getElementById("dashboard");
  const usernameDisplay = document.getElementById("username-display");
  const tiles = document.querySelectorAll(".tile");
  const toggleTheme = document.getElementById("theme-toggle");
  const body = document.body;
  const inrValueDisplay = document.createElement("p");
  document.getElementById("send-form").appendChild(inrValueDisplay);

  let balances = { BTC: 4.0, ETH: 8.0, USDT: 100000 };
  let transactions = [];
  let currentRates = {};

  loginForm.addEventListener("submit", e => {
    e.preventDefault();
    const username = document.getElementById("username").value.trim();
    if (username) {
      usernameDisplay.textContent = username;
      document.getElementById("login-page").style.display = "none";
      dashboard.style.display = "block";
    }
  });

  tiles.forEach(tile => {
    tile.addEventListener("click", e => {
      const isInsideInteractive = e.target.closest("form, select, input, button, label");
      if (isInsideInteractive) return;
      const content = tile.querySelector(".tile-content");
      content.classList.toggle("show");
    });
  });

  toggleTheme.addEventListener("click", () => {
    body.classList.toggle("dark-mode");
  });

  const fetchPrices = async () => {
    try {
      const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether&vs_currencies=inr");
      const data = await res.json();
      document.getElementById("btc-price").textContent = `₹${data.bitcoin.inr}`;
      document.getElementById("eth-price").textContent = `₹${data.ethereum.inr}`;
      document.getElementById("usdt-price").textContent = `₹${data.tether.inr}`;
      currentRates = {
        BTC: data.bitcoin.inr,
        ETH: data.ethereum.inr,
        USDT: data.tether.inr,
      };
    } catch (error) {
      console.error("Price fetch failed", error);
    }
  };
  fetchPrices();
  setInterval(fetchPrices, 30000);

  const updateInrValue = () => {
    const coin = document.getElementById("coin").value;
    const amount = parseFloat(document.getElementById("amount").value);
    if (!isNaN(amount) && amount > 0 && currentRates[coin]) {
      const inr = amount * currentRates[coin];
      inrValueDisplay.textContent = `≈ ₹${inr.toFixed(2)}`;
    } else {
      inrValueDisplay.textContent = "";
    }
  };
  document.getElementById("coin").addEventListener("change", updateInrValue);
  document.getElementById("amount").addEventListener("input", updateInrValue);

  document.getElementById("send-form").addEventListener("submit", e => {
    e.preventDefault();
    const coin = document.getElementById("coin").value;
    const recipient = document.getElementById("recipient-id").value;
    const amount = parseFloat(document.getElementById("amount").value);
    if (amount < 0.0001) {
      alert("Amount too small!");
      return;
    }
    if (amount <= balances[coin]) {
      balances[coin] -= amount;
      const statusChance = Math.random();
      let status = "Pending";
      if (statusChance < 0.7) status = "Paid";
      else if (statusChance < 0.9) status = "Failed";
      transactions.unshift({
        coin,
        amount,
        recipient,
        date: new Date().toLocaleString(),
        status,
      });
      updateHistory();
      updateBalances();
    } else {
      alert("Insufficient balance");
    }
    e.target.reset();
    inrValueDisplay.textContent = "";
  });

  const updateBalances = () => {
    document.getElementById("btc-balance").textContent = `${balances.BTC} BTC`;
    document.getElementById("eth-balance").textContent = `${balances.ETH} ETH`;
    document.getElementById("usdt-balance").textContent = `$${balances.USDT}`;
  };

  const updateHistory = () => {
    const list = document.getElementById("history-list");
    list.innerHTML = "";
    transactions.forEach(tx => {
      const li = document.createElement("li");
      let color = "orange";
      if (tx.status === "Paid") color = "purple";
      else if (tx.status === "Failed") color = "red";
      li.innerHTML = `<strong style="color:${color}">${tx.status}</strong> - ${tx.coin} ${tx.amount} to <em>${tx.recipient}</em><br><small>${tx.date}</small>`;
      list.appendChild(li);
    });
  };

  updateBalances();

  // Crypto Wallet Logic
  const walletCoinDropdown = document.getElementById("wallet-coin");
  const walletAddressDisplay = document.getElementById("wallet-address");
  const walletTileContent = walletCoinDropdown.closest(".tile-content");
  const address = "0xc592e84a3a4b4bfabbb8a6b3744fe8c81758d68c";

  const addFundInput = document.createElement("input");
  const addFundButton = document.createElement("button");
  addFundInput.setAttribute("type", "number");
  addFundInput.setAttribute("placeholder", "Enter amount to add");
  addFundInput.style.display = "none";
  addFundButton.textContent = "Add Fund";
  addFundButton.style.display = "none";
  walletTileContent.appendChild(addFundInput);
  walletTileContent.appendChild(addFundButton);

  walletCoinDropdown.addEventListener("change", () => {
    if (walletCoinDropdown.value) {
      walletAddressDisplay.textContent = address;
      walletAddressDisplay.style.cursor = "pointer";
      walletAddressDisplay.title = "Click to copy";
      addFundInput.style.display = "block";
      addFundButton.style.display = "block";
    } else {
      walletAddressDisplay.textContent = "Select a coin above";
      addFundInput.style.display = "none";
      addFundButton.style.display = "none";
    }
  });

  walletAddressDisplay.addEventListener("click", () => {
    if (walletAddressDisplay.textContent === address) {
      navigator.clipboard.writeText(address).then(() => {
        walletAddressDisplay.textContent = "Copied!";
        setTimeout(() => {
          walletAddressDisplay.textContent = address;
        }, 1500);
      });
    }
  });

  addFundButton.addEventListener("click", () => {
    const selectedCoin = walletCoinDropdown.value;
    const amount = parseFloat(addFundInput.value);
    if (selectedCoin && !isNaN(amount) && amount > 0) {
      balances[selectedCoin] += amount;
      updateBalances();
      alert(`${amount} ${selectedCoin} added to your wallet.`);
      addFundInput.value = "";
    } else {
      alert("Enter a valid amount.");
    }
  });
});