const amqplib = require('amqplib');
const EXCHANGE = 'amq.topic';
const CONSUMER_QUEUE = "orders.get";
const REPLY_ROUTING_KEY = "orders.get.reply";

async function main() {
    const connection = await amqplib.connect("amqp://localhost");
    const channel = await connection.createChannel();
    await channel.assertQueue(CONSUMER_QUEUE);
    await channel.bindQueue(CONSUMER_QUEUE, EXCHANGE, CONSUMER_QUEUE);
    await channel.consume(
        CONSUMER_QUEUE,
        (msg) => {
        if (msg) {
            console.log(msg.properties.correlationId);
            const content = JSON.parse(msg.content.toString());
            channel.publish(EXCHANGE, REPLY_ROUTING_KEY, Buffer.from(JSON.stringify(content)), 
            {correlationId: msg.properties.correlationId});
        }
        },
        { noAck: true },
    );
}



main();