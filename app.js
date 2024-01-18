const wa = require('@open-wa/wa-automate');
const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;

//MIDDLEWARES
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: false }));
app.use(cors());

wa.create({
  sessionId: 'COVID_HELPER',
  multiDevice: true, //required to enable multiDevice support
  authTimeout: 60, //wait only 60 seconds to get a connection with the host account device
  blockCrashLogs: true,
  disableSpins: true,
  headless: true,
  hostNotificationLang: 'PT_BR',
  logConsole: false,
  popup: true,
  qrTimeout: 0, //0 means it will wait forever for you to scan the qr code
}).then((client) => start(client));

function start(client) {
  app.get('/test', (req, res) => {
    client.sendText('6285172160300@c.us', 'Hi, nice to meet you.');
    return res.send('Test message has been sent.');
  });

  app.post('/api/receipt/send', (req, res) => {
    const { action, customer_name, customer_id, payment, invoice_number, initial_number, final_balance, created_at, menu_names, menu_amount, menu_prices, menu_kinds, menu_discounts, menu_discount_percents } = req.body;

    let menuNames = menu_names.split(',');
    let menuAmounts = menu_amount.split(',');
    let menuKinds = menu_kinds.split(',');

    const whatsappNumber = `62${customer_id.slice(1)}@c.us`;

    const topupNotification = `Invoice: ${invoice_number}\n\nAnda baru saja melakukan top-up sejumlah *Rp. ${Intl.NumberFormat(['ban', 'id']).format(payment)},-* sehingga saldo anda saat ini adalah Rp. ${Intl.NumberFormat([
      'ban',
      'id',
    ]).format(final_balance)},-\nSelamat bersantai, ${customer_name}!\n--------------------\n_You just did top-up with an amount of *IDR ${Intl.NumberFormat(['ban', 'id']).format(
      payment
    )},-* so your balance is now_ _IDR ${Intl.NumberFormat('en-US').format(final_balance)},-_\n_Happy Drinking, ${customer_name}!_`;

    let menuSummary = '';
    menuNames.forEach((menuName, i) => {
      if (!menuKinds[i]) {
        menuSummary += `   - ${menuName} x ${menuAmounts[i]}\n`;
      } else {
        menuSummary += `   - ${menuName} (${menuKinds[i]}) x ${menuAmounts[i]}\n`;
      }
    });

    const paymentNotification = `Invoice: ${invoice_number}\n\nAnda baru saja melakukan payment sejumlah *Rp. ${Intl.NumberFormat(['ban', 'id']).format(
      payment
    )},-* dengan rincian pesanan sebagai berikut:\n\n${menuSummary}\nsisa saldo anda saat ini adalah Rp. ${Intl.NumberFormat(['ban', 'id']).format(
      final_balance
    )},-\nSelamat bersantai, ${customer_name}!\n--------------------\n_You just did top-up with an amount of_ _*IDR ${Intl.NumberFormat('en-US').format(
      payment
    )}* and following order detail:_\n\n${menuSummary}\n_so your balance is now IDR ${Intl.NumberFormat('en-US').format(final_balance)}_\n_Happy Drinking, ${customer_name}!_`;

    const checkoutNotification = `Invoice: ${invoice_number}\n\nAnda baru saja melakukan checkout dan menerima sejumlah uang deposit anda sebesar *Rp. ${Intl.NumberFormat(['ban', 'id']).format(
      payment
    )},-*. \nSampai jumpa di lain waktu, ${customer_name}!\n--------------------\n_You just did checkout and received your deposit with an amount of *IDR ${Intl.NumberFormat('en-US').format(
      payment
    )}*_\n_See you next time, ${customer_name}!_`;

    // SEND RECEIPT TO CUSTOMER
    if (action === 'topup') {
      client.sendText(whatsappNumber, topupNotification);
    } else if (action === 'pay') {
      if (menuNames.length) {
        client.sendText(whatsappNumber, paymentNotification);
      }
    } else if (action === 'checkout') {
      client.sendText(whatsappNumber, checkoutNotification);
    }

    return res.json('Test message has been sent.');
  });

  app.post('/api/notification/send', (req, res) => {
    const { customer_name, customer_id, balance } = req.body;

    const balanceNotification = `Kartu anda atas nama ${customer_name} memiliki saldo sebesar *Rp. ${Intl.NumberFormat(['ban', 'id']).format(
      balance
    )},-*\n--------------------\n_Your card with name ${customer_name} has a balance of *IDR ${Intl.NumberFormat('en-US').format(balance)}*_`;

    const whatsappNumber = `62${customer_id.slice(1)}@c.us`;

    client.sendText(whatsappNumber, balanceNotification);

    return res.json('Test message has been sent.');
  });
}

app.listen(port, () => {
  console.log(`listening to port ${port}`);
});
