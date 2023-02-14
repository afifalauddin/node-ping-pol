require('dotenv').config();
const ping = require('ping');
const cron = require('node-cron');
const fetch = require('node-fetch');
const winston = require('winston');
require('winston-daily-rotate-file');

//split from .env file by ,
const HOSTS = (process.env.HOSTS || '').split(',');

const HTTP_API_TOKEN = process.env.HTTP_API_TOKEN || '';
const CHAT_ID = process.env.CHAT_ID || '';

const MONITOR_DOWN_ONLY = process.env.MODE === 'DOWN' ? true : false;

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.json(),
    winston.format.prettyPrint()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    new winston.transports.DailyRotateFile({
      dirname: 'logs',
      filename: 'application-%DATE%.log',
      datePattern: 'YYYY-MM-DD-HH',
      zippedArchive: true,
      maxSize: '2m',
      maxFiles: '3d',
    }),
  ],
});

const sendMessageToTelegram = (message) => {
  logger.info('Sending Notification to Telegram');
  const url = `https://api.telegram.org/bot${HTTP_API_TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${message}`;
  fetch(url)
    .then((res) => res.json())
    .then((json) => {
      if (json.ok) {
        logger.info('Message sent to telegram');
      } else {
        logger.error('Error sending message to telegram', {
          response: json,
        });
      }
    })
    .catch((err) => {
      logger.error('Error sending message to telegram', { err });
    });
};

const checkServerStatus = () => {
  HOSTS.forEach(function (host) {
    ping.sys.probe(host, function (isAlive) {
      var msg = isAlive
        ? 'host: ' + host + ' is alive'
        : 'host: ' + host + ' is dead';
      logger.info(msg);
      if (MONITOR_DOWN_ONLY) {
        if (!isAlive) {
          sendMessageToTelegram(msg);
        }
      } else {
        sendMessageToTelegram(msg);
      }
    });
  });
};

cron.schedule(process.env.SCHEDULE || '* * * * *', () => {
  checkServerStatus();
});

logger.info('Monitoring Started - [Environment]', {
  HOSTS,
  HTTP_API_TOKEN,
  CHAT_ID,
  MONITOR_DOWN_ONLY,
});

checkServerStatus();
