/** Author: Daniel Brame 
 *  Echo Service is a super simple AMQP service that accepts a message on one routing key and publishes it back to another.  It assumes to always
 *  amqp.topic
*/

const amqplib = require('amqplib');
const EXCHANGE = 'amq.topic';
const CONSUMER_QUEUE = process.env['CONSUMER_QUEUE'] || 'sample_request';
const CONSUMER_KEY = process.env["CONSUMER_KEY"] || 'sample.request';
const REPLY_ROUTING_KEY = process.env["REPLY_KEY"] || 'sample.reply';

async function main() {
    const connection = await amqplib.connect("amqp://localhost");
    const channel = await connection.createChannel();
    await channel.assertQueue(CONSUMER_QUEUE);
    await channel.bindQueue(CONSUMER_QUEUE, EXCHANGE, CONSUMER_KEY);
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