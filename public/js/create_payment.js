$(document).ready(function() {
	// Create instance of Stripe object
	var stripe = Stripe("pk_test_ZubFPtU3gWDRFzhmWmCP2Jip");

	// Create instance of Elements to safely collect card information 
	var elements = stripe.elements();

	// Customize style of card Element below
	// Style is an object that accepts the four keys: 1) base, 2) complete, 3) empty, and 4) invalid
	// For each of the keys, there are many properties that can be set (i.e. color, fontFamily, fontSize)
	var style = {
		base: {
			color: "#32325d",
			fontSize: "16px",
			"::placeholder": {
				color: "#aab7c4"
			}
		},
		invalid: {
			color: "#fa755a",
			iconColor: "#fa755a"
		}
	};

	// Create instance of specific Element - card in this case
	// elements.create() takes two arguments:
	// 1) type (required): type of Element to create (i.e. card, cardNumber, cardExpiry, cardCcv)
	// 2) options (optional): object that contains additional information about the element created
	var card = elements.create("card", {
		style: style, 
		hidePostalCode: true
	});

	// Mount the card Element created into the DOM with ID 'card-element'
	card.mount("#card-element");

	// Listens for any changes in the card Element and validates input as it is typed
	// Can emit any one of the following: 1) blur, 2) change, 3) click, 4) focus, and 5) ready
	// Similar to card.onchange = function() {}
	// 
	card.addEventListener("change", function(event) {
		// Grab the element #card-errors and assign it to the variable errorDiv
		var errorDiv = document.getElementById("card-errors");
		// If there are errors, show them in #card-errors
		// If there are no errors, clear the text in #card-errors
		if (event.error) {
			errorDiv.textContent = event.error.message;
		} else {
			errorDiv.textContent = "";
		}
	});

	// When the form is submitted
	var form = document.getElementById("create-payment-form");
	form.addEventListener("submit", function(event) {
		event.preventDefault();

		// Reset CSS of form inputs
		reset();

		// Validate all fields except card Element
		validateForm();
	});

	function createPayment(token) {
		var transaction = {
			customerName: $("#customer-name").val().trim(),
			customerNumber: $("#customer-number").val().trim(),
			currency: $("#currency").val().trim(),
			price: $("#price").val().trim(),
			cardholderName: $("#cardholder-name").val().trim(),
			stripeToken: token.id
		};

		$.post("/create-payment", transaction)
		.done(function(data) {
			// Clear card data
			card.clear();

			// Clear all data from data from previous modal before displaying
			$("#create-payment-success").hide();
			$("#create-payment-error").hide();
			$("#create-payment-modal-header").text("");
			$("#success-payment-gateway").text("");
			$("#success-payment-reference-code").text("");
			$("#error-code").text("");
			$("#error-message").text("");
			$(".stripe-error").hide();
			$("#stripe-error-status-code").text("");
			$("#stripe-error-type").text("");
			$("#stripe-error-message").text("");
			$(".mongo-error").hide();
			$("#mongo-error-message").text("");

			console.log("Create Payment Response: ", data);
			if (!data.errorCode) {
				$("#create-payment-modal-header").text("Success");
				$("#success-payment-gateway").text(data.paymentGateway);
				$("#success-payment-reference-code").text(data.paymentReferenceCode);
				$("#create-payment-success").show();

				// Clear form inputs
				$("#customer-name").val("");
				$("#customer-number").val("");
				$("#currency").val("HKD");
				$("#price").val("");
				$("#cardholder-name").val("");
			} else {
				$("#create-payment-modal-header").text("Error");
				$("#error-code").text(data.errorCode);
				$("#error-message").text(data.message);

				if (data.stripe) {
					$("#stripe-error-status-code").text(data.stripe.statusCode);
					$("#stripe-error-type").text(data.stripe.type);
					$("#stripe-error-message").text(data.stripe.message);
					$(".stripe-error").show();
				} else if (data.mongo) {
					$("#mongo-error-message").text(data.mongo.message);
					$(".mongo-error").show();
				}

				$("#create-payment-error").show();
			}
			
			$("#create-payment-modal").modal("toggle");
		})
	};

	// Fields that need to be checked (excludes card Element)
	var fields = ["customer-name", "customer-number", "currency", "price", "cardholder-name"];

	function reset() {
		fields.forEach(function(field) {
			$("input#" + field + ".form-control").css("border-color", "#ced4da");
			$("select#" + field + ".form-control").css("border-color", "#ced4da");
			$("#" + field + "-error").hide();
		});
	};

	function validateForm() {
		console.log("validating create payment form...");
		let valid = true;

		// Check if all fields are completed (excludes card Element)
		fields.forEach(function(field) {
			if (!$("#" + field).val()) {
				$("input#" + field + ".form-control").css("border-color", "#fa755a");
				$("select#" + field + ".form-control").css("border-color", "#fa755a");
				$("#" + field + "-error").show();
				valid = false;
			}
		});

		console.log("card: ", card);

		// Convert card information collected by Elements into a token that can be safely passed to server
		// Takes two arguments:
		// 1) element (required): the Element/card in which you want to create a token from
		// 2) cardData (optional): object that contains additional information about the card (i.e. name, address, currency)
		// Returns a Promise which is resolved by a 'result' object
		// 'result' object as either: 
		// 1) result.token: the credit card token if the call was successful
		// 2) result.error: there was an error
		stripe.createToken(card).then(function(result) {
			if (result.error) {
				// Inform the customer that there was an error
				var errorElement = document.getElementById("card-errors");
				// .textContent is similar to .innerHTML but .textContent is meant to be text only and does not parse content as HTML while .innerHTML can include HTML tags and parses content as HTML
				errorElement.textContent = result.error.message;
			} else if (valid) {
				console.log("valid form!");
				// Send the token to your server only if other fields are also validated
				createPayment(result.token);
			}
		});
	};
});