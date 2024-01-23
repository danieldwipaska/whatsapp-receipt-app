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
    const { action, customer_name, customer_id, payment, invoice_number, final_balance, number, menu_names: menuNames, menu_amount: menuAmounts, menu_kinds: menuKinds, created_at } = req.body;

    const whatsappNumber = `62${number.slice(1)}@c.us`;
    const date = new Date(created_at);
    const formattedDateWithTime = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}`;

    const topupNotification = `${formattedDateWithTime}\nInvoice: ${invoice_number}\n\nAnda baru saja melakukan top-up sejumlah *Rp. ${Intl.NumberFormat(['ban', 'id']).format(
      payment
    )},-* sehingga saldo anda saat ini adalah Rp. ${Intl.NumberFormat(['ban', 'id']).format(final_balance)},-\nSelamat bersantai, ${customer_name}!\n--------------------\n_You just did top-up with an amount of *IDR ${Intl.NumberFormat([
      'ban',
      'id',
    ]).format(payment)},-* so your balance is now_ _IDR ${Intl.NumberFormat('en-US').format(final_balance)},-_\n_Happy Drinking, ${customer_name}!_`;

    let menuSummary = '';
    menuNames.forEach((menuName, i) => {
      if (!menuKinds[i]) {
        menuSummary += `   - ${menuName} x ${menuAmounts[i]}\n`;
      } else {
        menuSummary += `   - ${menuName} (${menuKinds[i]}) x ${menuAmounts[i]}\n`;
      }
    });

    const paymentNotification = `${formattedDateWithTime}\nInvoice: ${invoice_number}\n\nAnda baru saja melakukan payment sejumlah *Rp. ${Intl.NumberFormat(['ban', 'id']).format(
      payment
    )},-* dengan rincian pesanan sebagai berikut:\n\n${menuSummary}\nsisa saldo anda saat ini adalah Rp. ${Intl.NumberFormat(['ban', 'id']).format(
      final_balance
    )},-\nSelamat bersantai, ${customer_name}!\n--------------------\n_You just did top-up with an amount of_ _*IDR ${Intl.NumberFormat('en-US').format(
      payment
    )}* and following order detail:_\n\n${menuSummary}\n_so your balance is now IDR ${Intl.NumberFormat('en-US').format(final_balance)}_\n_Happy Drinking, ${customer_name}!_`;

    const checkoutNotification = `${formattedDateWithTime}\nInvoice: ${invoice_number}\n\nAnda baru saja melakukan checkout dan menerima sejumlah uang deposit anda sebesar *Rp. ${Intl.NumberFormat(['ban', 'id']).format(
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
    const { customer_name, customer_id, number, balance } = req.body;

    const balanceNotification = `Kartu anda atas nama ${customer_name} memiliki saldo sebesar *Rp. ${Intl.NumberFormat(['ban', 'id']).format(
      balance
    )},-*\n--------------------\n_Your card with name ${customer_name} has a balance of *IDR ${Intl.NumberFormat('en-US').format(balance)}*_`;

    const whatsappNumber = `62${number.slice(1)}@c.us`;

    client.sendText(whatsappNumber, balanceNotification);

    return res.json('Test message has been sent.');
  });
}

app.listen(port, () => {
  console.log(`listening to port ${port}`);
});
