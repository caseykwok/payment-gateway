$(document).ready(function() {
	// Fields that need to be checked
	var fields = ["customer-name", "payment-reference-code"];

	function reset() {
		fields.forEach(function(field) {
			$("input#" + field + ".form-control").css("border-color", "#ced4da");
			$("#" + field + "-error").hide();
		});
	};

	function validateForm() {
		console.log("validating check payment form...");
		let valid = true;

		// Check if all fields are completed (excludes card Element)
		fields.forEach(function(field) {
			if (!$("#" + field).val()) {
				$("input#" + field + ".form-control").css("border-color", "#fa755a");
				$("#" + field + "-error").show();
				valid = false;
			}
		});

		if (valid) {
			console.log("valid form!");
			checkPayment();
		}
	};

	function checkPayment() {
		var order = {
			customerName: $("#customer-name").val().trim(),
			paymentReferenceCode: $("#payment-reference-code").val().trim(),
		};

		$.post("/check-payment", order)
		.done(function(data) {
			// Clear all data from data from previous modal before displaying
			$("#check-payment-success").hide();
			$("#check-payment-error").hide();
			$("#check-payment-modal-header").text("");
			$("#success-customer-name").text("");
			$("#success-customer-number").text("");
			$("#success-currency").text("");
			$("#success-price").text("");
			$(".mongo-error").hide();
			$("#mongo-error-message").text("");

			console.log("Check Payment Response: ", data);		
			if (data.errorCode) {
				$("#check-payment-modal-header").text("Error");
				$("#error-code").text(data.errorCode);
				$("#error-message").text(data.message);

				if (data.mongo) {
					$("#mongo-error-message").text(data.mongo.message);
					$(".mongo-error").show();
				}

				$("#check-payment-error").show();
			} else {
				$("#check-payment-modal-header").text("Order Details");
				$("#success-customer-name").text(data.customerName);
				$("#success-customer-number").text(data.customerNumber);
				$("#success-currency").text(data.currency);
				$("#success-price").text(data.price);
				$("#check-payment-success").show();

				// Clear form inputs
				$("#customer-name").val("");
				$("#payment-reference-code").val("");				
			}

			$("#check-payment-modal").modal("toggle");
		})
	};

	// When the form is submitted
	var form = document.getElementById("check-payment-form");
	form.addEventListener("submit", function(event) {
		event.preventDefault();

		// Reset CSS of form inputs
		reset();

		// Validate all fields
		validateForm();
	});
});