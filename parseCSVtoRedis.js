var fs        = require("fs");
var redis     = require("redis");
var client    = redis.createClient(17911, "pub-redis-17911.us-east-1-2.4.ec2.garantiadata.com");
var Converter = require("csvtojson").Converter;
var converter = new Converter({});
 
client.on("error", function (err) {
    console.log("Error " + err);
});

converter.on("end_parsed", function (jason) {

	for(item in jason) {
		
		jason[item].desc = jason[item].desc.slice(0,29);

		client.hmset(jason[item].id,
			"desc", jason[item].desc,
			"upc", jason[item].upc,
			"min", jason[item].min,
			"wup", jason[item].wup
		);

		client.set(jason[item].desc, jason[item].id);
		
		tmp = "";
		lst = jason[item].id.length;
		les = lst - 1;
		for(var x = 0; x < lst; x++) {
			tmp += jason[item].id[x];
			client.zadd("zset_lexo_id", 0, tmp);
			if(x == les) {
				client.zadd("zset_lexo_id", 0, tmp + "*");
			}
		}
		tmp = "";
		for(var x = 0; x < 30; x++) {
			if(jason[item].desc[x]) {
				tmp += jason[item].desc[x];
				client.zadd("zset_lexo_desc", 0, tmp);
			}
			if(x == 29) {
				client.zadd("zset_lexo_desc", 0, tmp + "*");
			}
		}
	}
	client.quit();
});

var readStream = fs.createReadStream('../data.csv');
var writeStream = fs.createWriteStream('../data_lower.csv');
readStream.on('data', function (chunk) {
    var convertedChunk = chunk.toString().toLowerCase();
    writeStream.write(convertedChunk);
});
readStream.on('end', function () {
    writeStream.end();
    fs.createReadStream("../data_lower.csv").pipe(converter);
});
