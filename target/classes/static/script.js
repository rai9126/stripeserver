var stripe;

var orderData = {
    noOfItems: 0,
    currency: "usd"
};

// Disable the button until we have Stripe set up on the page
document.getElementById("submit").disabled = true;

document.getElementById("checkout-button").addEventListener("click",
function(data){
    fetch("http://localhost:4242/create-payment-intent", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(orderData)
    })
        .then(function(result) {
            return result.json();
        })
        .then(function(data) {
            document.getElementById("submit").disabled = false;
            var ele = document.getElementById("number-input-div");
            ele.setAttribute("hidden",true);
            var ele2 = document.getElementById("enable-payment");
            ele2.removeAttribute("hidden");
            return setupElements(data);
        })
        .then(function({ stripe, card, clientSecret }) {

            // Handle form submission.
            var form = document.getElementById("payment-form");
            form.addEventListener("submit", function(event) {
                event.preventDefault();
                // Initiate payment when the submit button is clicked
                pay(stripe, card, clientSecret);
            });
        });
}
);

document.getElementById("number-input").addEventListener("change", function(data){
orderData.noOfItems = data.currentTarget.value;
});

// Set up Stripe.js and Elements to use in checkout form
var setupElements = function(data) {
    stripe = Stripe(data.publishableKey);
    var elements = stripe.elements();
    var style = {
        base: {
            color: "#32325d",
            fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
            fontSmoothing: "antialiased",
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

    var card = elements.create("card", { style: style });
    card.mount("#card-element");

    return {
        stripe: stripe,
        card: card,
        clientSecret: data.clientSecret
    };
};

/*
 * Calls stripe.confirmCardPayment which creates a pop-up modal to
 * prompt the user to enter extra authentication details without leaving your page
 */
var pay = function(stripe, card, clientSecret) {
    changeLoadingState(true);

    // Initiate the payment.
    // If authentication is required, confirmCardPayment will automatically display a modal
    stripe
        .confirmCardPayment(clientSecret, {
            payment_method: {
                card: card
            }
        })
        .then(function(result) {
            if (result.error) {
                // Show error to your customer
                showError(result.error.message);
            } else {
                // The payment has been processed!
                orderComplete(clientSecret);
            }
        });
};

/* ------- Post-payment helpers ------- */

/* Shows a success / error message when the payment is complete */
var orderComplete = function(clientSecret) {
    // Just for the purpose of the sample, show the PaymentIntent response object
    stripe.retrievePaymentIntent(clientSecret).then(function(result) {
        var paymentIntent = result.paymentIntent;
        var paymentIntentJson = JSON.stringify(paymentIntent, null, 2);

        document.querySelector(".sr-payment-form").classList.add("hidden");
        document.querySelector("pre").textContent = paymentIntentJson;

        document.querySelector(".sr-result").classList.remove("hidden");
        setTimeout(function() {
            document.querySelector(".sr-result").classList.add("expand");
        }, 200);

        changeLoadingState(false);
    });
};

var showError = function(errorMsgText) {
    changeLoadingState(false);
    var errorMsg = document.querySelector(".sr-field-error");
    errorMsg.textContent = errorMsgText;
    setTimeout(function() {
        errorMsg.textContent = "";
    }, 4000);
};

// Show a spinner on payment submission
var changeLoadingState = function(isLoading) {
    if (isLoading) {
        document.querySelector("button").disabled = true;
        document.querySelector("#spinner").classList.remove("hidden");
        document.querySelector("#button-text").classList.add("hidden");
    } else {
        document.querySelector("button").disabled = false;
        document.querySelector("#spinner").classList.add("hidden");
        document.querySelector("#button-text").classList.remove("hidden");
    }
};