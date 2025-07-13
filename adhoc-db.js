const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
// Connection URL
var url = process.env.MONGODB_URI;

const wordList = require('./data/wordList.json');

// Database Name
dbName = 'heroku_k52dgw4p';

// Create a new MongoClient
client = new MongoClient(url, {
    // retry to connect for 60 times
    reconnectTries: 60,
    // wait 1 second before retrying
    reconnectInterval: 1000
});

// Use connect method to connect to the Server

var db, col;

function connect(collectionName) {
    return new Promise(resolve => {
        client.connect(function(err, db) {
            db = client.db(dbName);
            collectionName = collectionName || 'Words';
            col = db.collection(collectionName);
            console.log("Connected successfully to server");
            resolve({ client, db, col });
        });
    })
}



async function init() {
    var mongoDB = await connect('Temp');
    const { col, client } = mongoDB;
    // await col.insertOne(wordList[2]);
    client.close();

}

init();

module.exports = {
    connect: function (collectionName) {
        return new Promise(resolve => {
            client.connect(function(err, db) {
                db = client.db(dbName);
                collectionName = collectionName || 'Words';
                col = db.collection(collectionName);
                console.log("Connected successfully to server");
                resolve(client);
            });
        })
    },
    findByWord: function (word) {
        return new Promise(resolve => {
            resolve(col.findOne({"word": word}));
        })
    },
    random: function (){
        return new Promise(resolve => {
            col.countDocuments().then((count) => {
                var rand = Math.round(Math.random()*count);
                var db = client.db(dbName);
                var col = db.collection('Words');
                col.find().limit(1).skip(rand).limit(1).next().then(data => {
                    resolve(data);
                })
            });

        })
    },
    search: function (keyWord) {
        return new Promise(resolve => {
            col.find({"word": new RegExp(keyWord)}).toArray().then(data => {
                resolve(data);
            })
        })
    },
    insert: function (word) {
        return new Promise(resolve => {
            col.insertOne(word).then(data => {
                resolve(data);
            })
        })

    },
    update: function (word, fieldsUpdate) {
        return new Promise(resolve => {
            col.update({word:word}, fieldsUpdate).then(data => {
                resolve(data);
            })
        })
    },
    disconnect: function () {
        client.close();
    }
}



//
// connect().then(client => {
//
//     var db = client.db(dbName);
//     // db.createCollection('Words').then(() => {
//     //     console.log('Collection created');
//     //     client.close();
//     // });
//     // db.collection('Words').insertMany(wordList).then(() => {
//     //     console.log('Words added');
//     //     client.close();
//     // });
//     // var col = db.collection('words');
//     // console.log(col);
//     // col.find().then(data => {
//     //     console.log(data);
//     // })
//     // console.log(temp);
//
//
//
// });
