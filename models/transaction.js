var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var transactionSchema = new Schema({
	payment: {
		type: Object,
		required: "Please enter a valid payment object"
	},
	customerName: {
		type: String,
		required: "Please enter a valid name"
	},
	customerNumber: {
		type: String,
		required: "Please enter a valid phone number"
	},
	currency: {
		type: String,
		required: "Please enter a valid currency"
	},
	price: {
		type: String,
		default: 0
	},
	createdAt: {
		type: Date,
		default: Date.now
	}
})

var Transaction = mongoose.model("transaction", transactionSchema);

module.exports = Transaction;