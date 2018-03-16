var express = require("express");
var router = express.Router();
var stripe = require("stripe")("sk_test_j2igPtIFJunzdOjuIBs0N0D4");
var redisClient = require("../models/redis_connection");
var Transaction = require("../models/transaction");

router.get("/", function(req, res) {
	res.render("home");
});

router.get("/create-payment", function(req, res) {
	res.render("create_payment");
});

router.post("/create-payment", function(req, res) {
	console.log("In server creating payment...");
	console.log("Request: ", req.body);

	console.log(!req.body.customerName)
	console.log(!req.body.customerNumber)
	console.log(!["HKD", "USD", "AUD", "EUR", "JPY", "CNY"].includes(req.body.currency))
	console.log(isNaN(req.body.price))
	console.log(!req.body.cardholderName)
	console.log(!req.body.stripeToken)

	// Validation to make sure necessary parameters exist
	if (!req.body.customerName || !req.body.customerNumber || !["HKD", "USD", "AUD", "EUR", "JPY", "CNY"].includes(req.body.currency) || isNaN(req.body.price) || !req.body.cardholderName || !req.body.stripeToken) {
		res.json({
			errorCode: 1001,
			message: 'Invalid request parameters. Please make sure all of the following fields are provided: customerName (string), customerNumber (string), currency (string - either HKD, USD, AUD, EUR, JPY or CNY), price (integer), cardholderName (string), and stripeToken (string).'
		})
	} else {
		var token = req.body.stripeToken;
		var amount = parseInt(req.body.price);
		var currency = req.body.currency;

		// Create customer
		stripe.customers.create({
			description: `For ${req.body.customerName}`,
			source: token
		}, function(err, customer) {
			if (err) {
				console.log("Error: ", err);
				res.json({
					errorCode: 1002,
					message: "Create Stripe customer error.",
					stripe: {
						statusCode: err.raw.statusCode,
						type: err.raw.type,
						message: err.raw.message
					}
				})
			} else {
				console.log("Customer: ", customer);
				console.log("Customer ID: ", customer.id);
				console.log("Customer Default Source: ", customer.default_source);

				// Check customer's card brand
				stripe.customers.retrieveCard(
					customer.id,
					customer.default_source,
					function(err, card) {
						if (err) {
							console.log("Error: ", err);
							res.json({
								errorCode: 1003,
								message: "Retrieve Stripe customer card error.",
								stripe: {
									statusCode: err.raw.statusCode,
									type: err.raw.type,
									message: err.raw.message
								}
							})
						} else {
							console.log("Card: ", card);
							console.log("Card Brand: ", card.brand);

							var gateway;

							// If card brand is "American Express" or currency is either USD, AUD, EUR, JPY, CNY,
							// Then implement gateway A
							// Else implement gateway B
							if ((card.brand === "American Express") || (["USD", "AUD", "EUR", "JPY", "CNY"].includes(currency))) {
								console.log("Implementing gateway A...");
								gateway = "A";
							} else {
								console.log("Implementing gateway B...");
								gateway = "B";
							}

							// Charge the user's card
							stripe.charges.create({
								amount: amount,
								currency: currency,
								customer: customer.id,
							}, function(err, charge) {
								if (err) {
									console.log("Error: ", err);
									res.json({
										errorCode: 1004,
										message: "Charge Stripe customer card error.",
										stripe: {
											statusCode: err.raw.statusCode,
											type: err.raw.type,
											message: err.raw.message
										}
									});
								} else {
									console.log("Charge: ", charge);
									console.log("Charge ID: ", charge.id);

									var transaction = new Transaction({
										payment: charge,
										customerName: req.body.customerName,
										customerNumber: req.body.customerNumber,
										currency: currency,
										price: amount
									});

									// Save the new transaction to DB
									transaction.save(function(err, newTransaction) {
										if (err) {
											console.log("Error: ", err);
											res.json({
												errorCode: 1005,
												message: "Save new transaction to MongoDB error.",
												mongo: {
													message: err.message
												}
											});
										} else {
											console.log("Transaction saved!");
											console.log("New Transaction Added: ", newTransaction);

											// Save the new transaction to Redis (in addition to DB)									
											redisClient.set(`transaction:${newTransaction.payment.id}:${newTransaction.customerName}`, JSON.stringify(newTransaction));										

											res.json({
												paymentGateway: gateway,
												paymentReferenceCode: newTransaction.payment.id
											});
										}
									});
								}
							});
						}
					}
				)
			}
		});
	}
});

router.get("/check-payment", function(req, res) {
	res.render("check_payment");
});

router.post("/check-payment", async function(req, res) {
	console.log("In server checking payment...");
	console.log("Request: ", req.body);

	// Validation to make sure necessary parameters exist
	if (!req.body.paymentReferenceCode || !req.body.customerName) {
		return res.json({
			errorCode: 1006,
			message: 'Invalid request parameters. Please make sure all of the following fields are provided: customerName (string) and paymentReferenceCode (string).'
		})
	}

	const redisPaymentRecord = await new Promise(function(resolve, reject) {
		redisClient.get(`transaction:${req.body.paymentReferenceCode}:${req.body.customerName}`, function(err, obj) {
			if (err) {
				console.log("Error: ", err);
				resolve(null);
			} else if (!obj) {
				resolve(null);
			} else {
				console.log("Found record in Redis...")
				console.log("Redis Record: ", obj);
				resolve(JSON.parse(obj));					
			}
		});
	})

	if (redisPaymentRecord){
		console.log("Rendering Redis data...");
		console.log("Payment Record: ", redisPaymentRecord);
		return res.json(redisPaymentRecord);
	}

	console.log("No record in Redis...");

	const [err, paymentRecord] = await new Promise(function(resolve, reject) {
		Transaction.findOne({"payment.id": req.body.paymentReferenceCode, "customerName": req.body.customerName}).exec(function(err, result) {
			if (err) {
				console.log("Error: ", err);
				var jsonErr = {
					errorCode: 1007,
					message: "Find transaction in MongoDB error.",
					mongo: {
						message: err.message
					}
				};
				resolve([jsonErr,null]);
			} else if (!result) {
				console.log("No record in DB...");
				var jsonErr = {
					errorCode: 1008,
					message: "Record not found."
				}; 
				resolve([jsonErr, null]);
			} else {
				console.log("Found record in DB...");
				console.log("Database Record: ", result);

				resolve([null, result]);
			}
		})
	})

	if (err) {
		return res.json(err);
	} else {
		redisClient.set(`transaction:${req.body.paymentReferenceCode}:${req.body.customerName}`, JSON.stringify(paymentRecord));
		return res.json(paymentRecord)
	}
});

module.exports = router;
