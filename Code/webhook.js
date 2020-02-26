'use strict';


module.exports.delivered = async event => {
  //declaring the variables and assigning the values from the event 
    var AWS = require("aws-sdk");
    var docClient = new AWS.DynamoDB();
    var SNSClient = new AWS.SNS();
    const json = JSON.parse(JSON.stringify(event, null, 2));
    const messageId = json["body"]["event-data"]["message"]["headers"]["message-id"];
    console.log('messageId:' + messageId);
    const DDBTableName = process.env.WEBHOOK_TABLE;
    console.log('TableName:' + DDBTableName);

    var params = {
        TableName: DDBTableName,
        Item: {
            "messageId": {
                S: messageId
            }

        },
        ReturnValues: "ALL_OLD",
    };
    console.log("params value:" + ":" + params.TableName + ":" + params.Item.messageId.S);

    console.log("Adding a new item...");

    const eventStatus = json["body"]["event-data"]["event"];
    //processing the data in try block
    try {
        //inserting the data in dynamo db table
        var awsRequest = await docClient.putItem(params);
        var result = await awsRequest.promise();
        console.log(result);
        // publishing the event to SNS Topic subscribed to an email id
        if (eventStatus == 'delivered') {
            await SNSClient.publish({
                Message: JSON.stringify(json["body"], null, 2),
                Subject: 'Message has been delivered ',
                TopicArn: process.env.StreamArn
            }).promise();
            console.log("email Sent")
        } else if (eventStatus == 'opened') {
            await SNSClient.publish({
                Message: JSON.stringify(json["body"], null, 2),
                Subject: 'Message has been opened ',
                TopicArn: process.env.StreamArn
            }).promise();
        }
        return {
            'statusCode': 200,
            'message': "Data processed successfully, Notification has been sent"
        }
    } catch (err) {
        console.log(err);
    }
};