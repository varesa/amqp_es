


var rabbitmq_host = process.env.rabbitmq_host;
var elastic_host = process.env.elastic_host;


/* Elasticsearch */

var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
  host: elastic_host,
  log: 'trace'
});


/* RabbitMQ */

var amqp = require("amqplib/callback_api");
amqp.connect("amqp://" + rabbitmq_host, function (err, conn) {
    conn.createChannel(function (err, ch) {
        var exchange = "amqp.irc";
        ch.assertExchange(exchange, "topic", {durable: false});

        ch.assertQueue('', {exclusive: true}, function (err, q) {
            ch.bindQueue(q.queue, exchange, "messages.#");
            ch.consume(q.queue, function (msg) {
                var index = "irc";
                if(msg.fields.routingKey.startsWith("messages.twitch")) {
                    index = "twitch";
                }

                var obj = JSON.parse(msg.content.toString("utf-8"));
                obj.date = new Date(obj.time).toISOString();

                client.create({
                    index: index,
                    type: "chat",
                    body: obj
                }, function (err, resp) {
                    console.log(err);
                    console.log(resp);
                });
            });
        });


    })
});