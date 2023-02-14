require('dotenv').config();
const ping = require('ping');
const cron = require('node-cron');
const fetch = require('node-fetch');

//split from .env file by ,
const HOSTS = (process.env.HOSTS || '').split(',');

const HTTP_API_TOKEN = process.env.HTTP_API_TOKEN || '';
const CHAT_ID = process.env.CHAT_ID || '';

const sendMessageToTelegram = (message) => {
  const url = `https://api.telegram.org/bot${HTTP_API_TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${message}`;
  fetch(url)
    .then((res) => res.json())
    .then((json) => {
      if (json.ok) {
        console.log('Message sent to telegram');
      }
    });
};

const checkServerStatus = () => {
  HOSTS.forEach(function (host) {
    ping.sys.probe(host, function (isAlive) {
      var msg = isAlive
        ? 'host: ' + host + ' is alive'
        : 'host: ' + host + ' is dead';
      console.log(msg);
      sendMessageToTelegram(msg);
    });
  });
};

cron.schedule('* * * * *', () => {
  checkServerStatus();
});

console.log('Monitoring Started');
checkServerStatus();
