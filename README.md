# Payment Gateway

## Table of Contents 

1. [Overview](#overview)
2. [Installation](#installation)
3. [Initializing](#initializing)
4. [API Endpoint](#api-endpoint)

<a name="overview"></a>
## Overview

payment-gateway is a Node.js mock payment gateway app that utilizes MongoDB to keep track of payments made and Express to handle routing. It takes in order details and payment information provided by users and allow users to check on their transaction details.

<a name="installation"></a>
## Installation (Mac)

### Step 1: Install MongoDB

1. Install MongoDB via Homebrew

	```
	brew install mongodb
	```

2. Create a folder `data/` with subdirectory `db/` at the root of the user's machine for MongoDB to write data to it

	```
	sudo mkdir -p /data/db
	```

3. Make the user the owner of the directory `/data/db` to give their account read and write permissions on the folder

	```
	sudo chown -R $USER /data/db
	```

4. Start MongoDB

	```
	mongod
	```

### Step 2: Install Redis 

1. Install Redis via Homebrew

	```
	brew install redis
	```

2. Start the Redis server

	```
	redis-server
	```

### Step 3: Git Clone

Clone payment-gateway to your local git repo like the following:

```
git clone https://github.com/caseykwok/payment-gateway.git
```

The payment-gateway project and its files should now be in your project folder.

### Step 4: Install Dependencies

Install all modules listed as dependencies in `package.json` like the following:

```
npm install
```

The dependencies should now be in the local `node_modules` folder.

<a name="initializing"></a>
## Initializing

Run the application on the user's local server.

1. Ensure the two steps in [Installation](#installation) are completed.

2. Run the Node application called `server.js` to initialize the user's local server like the following:

	```
	node server.js
	```

3. Open the browser and connect to [port 3000 of the local host](http://localhost:3000/) to reach the homepage.

<a name="api-endpoint"></a>
## API Endpoint

1. **POST** `/create-payment`

	*Request Parameters*

	| Name				| Data Type	| Description							|
	| ----------------- | --------- | ------------------------------------- |
	| customerName		| string	| Customer name for the order.			|
	| customerNumber	| integer	| Customer phone number for the order.	|
	| currency			| string	| Currency type to be charged on card.	|
	| price				| integer	| Amount to be charged on card.			|
	| cardholderName	| string	| Full name printed on card.			|
	| stripeToken		| string	| Single-use Stripe token generated based on card information collected by Stripe Elements. |

	*Response Parameters*

	| Name					| Data Type	| Description						|
	| --------------------- | --------- | --------------------------------- |
	| paymentGateway		| string	| Payment gateway used for the order. |
	| paymentReferenceCode	| string	| Payment reference code for the order. |

	*Example Response*

	```
	{
		paymentGateway: "string",
		paymentReferenceCode: "string"
	}
	```

	*Error Response*

	| Error Code	| Error Message											|
	| ------------- | ----------------------------------------------------- |
	| 1001			| Invalid request parameters. Please make sure all of the following fields are provided: customerName (string), customerNumber (string), currency (string - either HKD, USD, AUD, EUR, JPY or CNY), price (integer), cardholderName (string), and stripeToken (string). |
	| 1002			| Create Stripe customer error. 						|
	| 1003			| Retrieve Stripe customer card error. 					|
	| 1004			| Charge Stripe customer card error. 					|
	| 1005			| Save new transaction to MongoDB error. 				|

	*Example Error Response*

	```
	{
		errorCode: integer,
		message: "string",
		stripe: {
			statusCode: integer,
			type: "string",
			message: "string"
		}
	}
	```

2. **POST** `/check-payment`

	*Request Parameters*

	| Name					| Data Type	| Description						|
	| --------------------- | --------- | --------------------------------- |
	| customerName			| string	| Customer name for the order.		|
	| paymentReferenceCode	| string	| Payment reference code for the order. |

	*Response Parameters*

	| Name					| Data Type	| Description						|
	| --------------------- | --------- | --------------------------------- |
	| customerName		| string	| Customer name for the order.			|
	| customerNumber	| string	| Customer phone number for the order.	|
	| currency			| string	| Currency type charged on card.		|
	| price				| string	| Amount charged on card.				|
	| payment			| object	| Stripe payment object including payment reference code, amount charged, and currency and card used. [[More Info]](https://stripe.com/docs/api#create_charge) |
	| createdAt			| string		| Date in which order was created. 		|

	*Example Response*

	```
	{
		customerName: "string",
		customerNumber: "string",
		currency: "string",
		price: "string",
		payment: {
			"id" : "string",
			"object" : "string", 
			...
			...
			"source" : {
				"id" : "string",
				"object" : "card",
				"address_city" : null,
				"address_country" : null,
				"address_line1" : null,
				"brand" : "string",
				"country" : "string",
				"customer" : "string",
				"cvc_check" : "pass",
				...
				...
        	}
		},
		createdAt: "string"
	}
	```

	*Error Response*

	| Error Code	| Error Message											|
	| ------------- | ----------------------------------------------------- |
	| 1006			| Invalid request parameters. Please make sure all of the following fields are provided: customerName (string) and paymentReferenceCode (string). |
	| 1007			| Find transaction in MongoDB error.					|
	| 1008			| Record not found. 									|

	*Example Error Response*

	```
	{
		errorCode: integer,
		message: "string",
	}
	```

